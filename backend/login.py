from flask import Flask, render_template, request

app = Flask(__name__)

# Dummy user data
users = {
    "teacher": {"username": "teacher1", "password": "teach123"},
    "student": {"username": "student1", "password": "stud123"},
    "parent": {"username": "parent1", "password": "parent123"},
    "college": {"username": "college1", "password": "college123"}
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login/<role>', methods=['GET', 'POST'])
def login(role):
    if role not in users:
        return "Invalid role", 404

    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']

        if username == users[role]['username'] and password == users[role]['password']:
            return render_template('dashboard.html', username=username, role=role)
        else:
            return render_template('login_form.html', role=role, error="Wrong username or password")

    return render_template('login_form.html', role=role)

if __name__ == '__main__':
    app.run(debug=True)
