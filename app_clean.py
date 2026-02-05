from flask import Flask, render_template, jsonify, request, redirect, url_for, flash, send_file
from flask_socketio import SocketIO
import sqlite3
import json
import random
import time
import threading
import numpy as np
import pandas as pd
import requests
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import redis
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
import openpyxl
from io import BytesIO

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
socketio = SocketIO(app, cors_allowed_origins="*")

# Load environment variables
load_dotenv()

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Redis setup for caching
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# ML Model for predictions
ml_model = None
scaler = None

# User class for Flask-Login
class User(UserMixin):
    def __init__(self, id, username, email, role, full_name, department):
        self.id = id
        self.username = username
        self.email = email
        self.role = role
        self.full_name = full_name
        self.department = department

@login_manager.user_loader
def load_user(user_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, role, full_name, department FROM users WHERE id = ?', (user_id,))
    user_data = cursor.fetchone()
    conn.close()
    if user_data:
        return User(*user_data)
    return None

def train_ml_model():
    """Train ML model for patient flow prediction"""
    global ml_model, scaler

    try:
        conn = get_db()
        cursor = conn.cursor()

        # Get historical data
        cursor.execute('''
            SELECT
                strftime('%H', datetime(created_at, 'unixepoch')) as hour,
                strftime('%w', datetime(created_at, 'unixepoch')) as day_of_week,
                COUNT(*) as patient_count,
                AVG((entry_time - created_at) / 60) as avg_waiting_time
            FROM patients
            GROUP BY strftime('%Y-%m-%d %H', datetime(created_at, 'unixepoch'))
            ORDER BY created_at DESC
            LIMIT 1000
        ''')

        data = cursor.fetchall()
        conn.close()

        if len(data) < 10:
            return  # Not enough data for training

        df = pd.DataFrame(data, columns=['hour', 'day_of_week', 'patient_count', 'avg_waiting_time'])
        df = df.fillna(0)

        X = df[['hour', 'day_of_week', 'patient_count']].astype(float)
        y = df['avg_waiting_time'].astype(float)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)

        ml_model = RandomForestRegressor(n_estimators=100, random_state=42)
        ml_model.fit(X_train_scaled, y_train)

        print("ML model trained successfully")

    except Exception as e:
        print(f"ML training error: {e}")

# Database setup
def get_db():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users table for authentication
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password_hash TEXT,
            role TEXT,
            full_name TEXT,
            department TEXT,
            created_at REAL,
            is_active BOOLEAN DEFAULT 1
        )
    ''')

    # Patients table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY,
            name TEXT,
            stage TEXT,
            entry_time REAL,
            doctor_id INTEGER,
            resource_id INTEGER,
            created_at REAL,
            priority TEXT,
            medical_history TEXT,
            phone TEXT,
            address TEXT,
            emergency_contact TEXT
        )
    ''')

    # Doctors table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY,
            name TEXT,
            status TEXT,
            specialization TEXT,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Resources table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY,
            name TEXT,
            status TEXT,
            type TEXT
        )
    ''')

    # Appointments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY,
            patient_id INTEGER,
            doctor_id INTEGER,
            appointment_date TEXT,
            appointment_time TEXT,
            status TEXT,
            notes TEXT,
            created_at REAL,
            FOREIGN KEY (patient_id) REFERENCES patients (id),
            FOREIGN KEY (doctor_id) REFERENCES doctors (id)
        )
    ''')

    # Notifications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            message TEXT,
            type TEXT,
            is_read BOOLEAN DEFAULT 0,
            created_at REAL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    conn.commit()
    conn.close()

def generate_simulated_data():
    conn = get_db()
    cursor = conn.cursor()

    # Check if users already exist
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        # Create default users
        default_users = [
            ('admin', 'admin@hospital.com', generate_password_hash('admin123'), 'admin', 'System Administrator', 'IT'),
            ('doctor', 'doctor@hospital.com', generate_password_hash('doctor123'), 'doctor', 'Dr. John Smith', 'Ophthalmology'),
            ('nurse', 'nurse@hospital.com', generate_password_hash('nurse123'), 'nurse', 'Jane Nurse', 'General'),
            ('reception', 'reception@hospital.com', generate_password_hash('reception123'), 'receptionist', 'Bob Receptionist', 'Front Desk')
        ]
        cursor.executemany('''
            INSERT INTO users (username, email, password_hash, role, full_name, department, created_at, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        ''', [(u[0], u[1], u[2], u[3], u[4], u[5], time.time()) for u in default_users])

    # Check if data already exists
    cursor.execute('SELECT COUNT(*) FROM patients')
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    # Generate doctors
    doctors = [
        ('Dr. Smith', random.choice(['Available', 'Busy', 'On Break']), 'Ophthalmology'),
        ('Dr. Johnson', random.choice(['Available', 'Busy', 'On Break']), 'Cardiology'),
        ('Dr. Williams', random.choice(['Available', 'Busy', 'On Break']), 'Neurology'),
        ('Dr. Brown', random.choice(['Available', 'Busy', 'On Break']), 'Orthopedics'),
        ('Dr. Jones', random.choice(['Available', 'Busy', 'On Break']), 'Dermatology')
    ]
