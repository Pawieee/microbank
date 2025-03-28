from flask import Flask, flash, redirect, render_template, request, session, url_for
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from functools import wraps
from sqlalchemy import create_engine, Column, Date, Integer, String
from sqlalchemy.ext.declarative import declarative_base

# Configure application
app = Flask(__name__)

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Use sqlalchemy instead
conn = create_engine("sqlite:///database.db")
Base = declarative_base()

class BankDB(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True)

    def __init__(self, name):
        self.name = name    


Base.metadata.create_all(conn)

def login_required(f):
    """
    Decorate routes to require login.

    http://flask.pocoo.org/docs/0.12/patterns/viewdecorators/
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)

    return decorated_function


def compute(score, total):
    based = ((score / total) * 85) + 15
    return based


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/")
def index():
    return render_template("index.html")


""" Log-in, log-out from CS50 P-Set 9: Finance"""


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        confirm = request.form.get("confirm")

        users = conn.execute("SELECT username FROM users;")

        # Check if username already exists in database
        for dicts in users:
            for name in dicts.values():
                if name == username:
                    error = True
                    return render_template("register.html", error=error)

        if password != confirm:
            error = True
            return render_template("register.html", error=error)

        hashcode = generate_password_hash(password)

        conn.execute(
            "INSERT INTO users (username, hash) VALUES (?, ?);", username, hashcode
        )

        return redirect("/")
    else:
        return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        session.clear()

        username = request.form.get("username")
        password = request.form.get("password")

        # Query database for username
        rows = conn.execute(
            "SELECT * FROM users WHERE username = ?", request.form.get("username")
        )

        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], request.form.get("password")
        ):
            error = True
            return render_template("login.html", error=error)

        session["user_id"] = rows[0]["id"]

        return redirect(url_for("grades"))

    else:
        return render_template("login.html")


@app.route("/addsub", methods=["GET", "POST"])
@login_required
def addsub():
    if request.method == "POST":
        subject = request.form.get("subject")
        units = request.form.get("units")
        prof = request.form.get("prof")

        if not subject or not units:
            error = True
            return render_template("addsub.html", error=error)

        conn.execute(
            "INSERT INTO course_record (user_id, subject, units, prof) VALUES (?, ?, ?, ?)",
            session["user_id"],
            subject,
            units,
            prof,
        )

        flash("Subject added successfully!")

        return redirect(url_for("grades"))
    else:
        return render_template("addsub.html")


@app.route("/addscore", methods=["GET", "POST"])
@login_required
def addscore():
    if request.method == "POST":
        subject = request.form.get("subject")
        type = request.form.get("type")
        score = request.form.get("scores")
        items = request.form.get("score_items")

        if not subject or not type:
            error = True
            subjects = conn.execute(
                "SELECT subject FROM course_record WHERE user_id = ?",
                session["user_id"],
            )
            return render_template("addscore.html", error=error, subjects=subjects)

        if score > items:
            error1 = True
            subjects = conn.execute(
                "SELECT subject FROM course_record WHERE user_id = ?",
                session["user_id"],
            )
            return render_template("addscore.html", error1=error1, subjects=subjects)

        if type == "activities":
            conn.execute(
                "UPDATE course_record SET activities = activities + ?, total_activities = total_activities + ? WHERE user_id = ? AND subject = ?",
                score,
                items,
                session["user_id"],
                subject,
            )
        else:
            conn.execute(
                "UPDATE course_record SET ? = ? WHERE user_id = ? AND subject = ?",
                type,
                score,
                session["user_id"],
                subject,
            )

        activity = conn.execute(
            "SELECT activities FROM course_record WHERE user_id = ? AND subject = ?",
            session["user_id"],
            subject,
        )
        activity1 = activity[0]["activities"]

        total = conn.execute(
            "SELECT total_activities FROM course_record WHERE user_id = ? AND subject = ?",
            session["user_id"],
            subject,
        )
        total1 = total[0]["total_activities"]

        first = conn.execute(
            "SELECT first_exam FROM course_record WHERE user_id = ? AND subject = ?",
            session["user_id"],
            subject,
        )
        first1 = first[0]["first_exam"]

        second = conn.execute(
            "SELECT second_exam FROM course_record WHERE user_id = ? AND subject = ?",
            session["user_id"],
            subject,
        )
        second1 = second[0]["second_exam"]

        third = conn.execute(
            "SELECT third_exam FROM course_record WHERE user_id = ? AND subject = ?",
            session["user_id"],
            subject,
        )
        third1 = third[0]["third_exam"]

        final = conn.execute(
            "SELECT final_exam FROM course_record WHERE user_id = ? AND subject = ?",
            session["user_id"],
            subject,
        )
        final1 = final[0]["final_exam"]

        if activity1 or total1 == 0:
            acts = 0
        else:
            acts = compute(activity1, total1) * 0.4

        e1 = compute(first1, 50) * 0.1
        e2 = compute(second1, 50) * 0.1
        e3 = compute(third1, 50) * 0.1
        f1 = compute(final1, 100) * 0.3

        grade = acts + e1 + e2 + e3 + f1

        if grade >= 96:
            conn.execute(
                "UPDATE course_record SET grade = ? WHERE user_id = ? AND subject = ?",
                4.0,
                session["user_id"],
                subject,
            )
        elif 90 <= grade <= 95:
            conn.execute(
                "UPDATE course_record SET grade = ? WHERE user_id = ? AND subject = ?",
                3.5,
                session["user_id"],
                subject,
            )
        elif 85 <= grade <= 89:
            conn.execute(
                "UPDATE course_record SET grade = ? WHERE user_id = ? AND subject = ?",
                3.0,
                session["user_id"],
                subject,
            )
        elif 80 <= grade <= 84:
            conn.execute(
                "UPDATE course_record SET grade = ? WHERE user_id = ? AND subject = ?",
                2.5,
                session["user_id"],
                subject,
            )
        elif 75 <= grade <= 79:
            conn.execute(
                "UPDATE course_record SET grade = ? WHERE user_id = ? AND subject = ?",
                2.0,
                session["user_id"],
                subject,
            )
        else:
            conn.execute(
                "UPDATE course_record SET grade = ? WHERE user_id = ? AND subject = ?",
                1.0,
                session["user_id"],
                subject,
            )

        flash("Score added successfully!")

        return redirect(url_for("grades"))

    else:
        subjects = conn.execute(
            "SELECT subject FROM course_record WHERE user_id = ?", session["user_id"]
        )
        return render_template("addscore.html", subjects=subjects)


@app.route("/grades")
@login_required
def grades():
    course = conn.execute(
        "SELECT * FROM course_record WHERE user_id = ?", session["user_id"]
    )
    return render_template("grades.html", course=course)


@app.route("/change", methods=["GET", "POST"])
@login_required
def change():
    """Change password"""
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        newpassword = request.form.get("newpassword")
        confirmation = request.form.get("confirm")

        # Ensure current password IS THE PASSWORD
        rows = conn.execute(
            "SELECT * FROM users WHERE username = ?", request.form.get("username")
        )

        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], request.form.get("password")
        ):
            error = True
            return render_template("change.html", error=error)

        # Ensure new password isn't the same with old password
        if newpassword == password:
            error1 = True
            return render_template("change.html", error1=error1)

        # Ensure new password is the same with confirmation
        elif newpassword != confirmation:
            error2 = True
            return render_template("change.html", error2=error2)

        hashcode = generate_password_hash(newpassword)

        conn.execute("UPDATE users SET hash = ?", hashcode)

        return redirect(url_for("grades"))

    else:
        return render_template("change.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")