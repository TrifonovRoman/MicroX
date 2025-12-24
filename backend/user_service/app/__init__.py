from flask import Flask
from .database import db
from flask_migrate import Migrate
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()
migrate = Migrate()

def create_app():
    app = Flask(__name__, static_folder="uploads")
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config["JWT_SECRET"] = os.environ["JWT_SECRET"]
    app.config["JWT_ALGORITHM"] = os.environ["JWT_ALGORITHM"]
    app.config["ACCESS_EXPIRES"] = os.environ.get("ACCESS_TOKEN_EXPIRES_MINUTES", 15)
    app.config["REFRESH_EXPIRES"] = os.environ.get("REFRESH_TOKEN_EXPIRES_DAYS", 7)

    db.init_app(app)
    migrate.init_app(app, db)

    from .routes import bp
    app.register_blueprint(bp)

    return app

app = create_app()