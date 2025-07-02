# In a file like `app/commands.py` or just `commands.py` at the root

import os
import click
from flask.cli import with_appcontext
from .models import db, User  # Adjust the import based on your project structure

@click.command('seed-master')
@with_appcontext
def seed_master_command():
    """Creates a master user from environment variables."""
    
    # 1. Read credentials securely from environment variables
    master_email = os.getenv('MASTER_USER_EMAIL')
    master_password = os.getenv('MASTER_USER_PASSWORD')

    if not master_email or not master_password:
        click.echo('MASTER_USER_EMAIL and MASTER_USER_PASSWORD environment variables not set. Skipping master user creation.')
        return

    # 2. Check if a user with this email already exists
    # We must use the model's encryption to perform the lookup.
    # A direct DB query on the encrypted column would not work.
    existing_user = User.query.filter(User.email_encrypted == User.encrypt_data(None, master_email)).first()

    if existing_user:
        click.echo(f'User with email {master_email} already exists.')
        # You could optionally update their 'is_master' status here if needed
        if not existing_user.is_master:
            existing_user.is_master = True
            db.session.commit()
            click.echo(f'Updated user {master_email} to be a master user.')
        return

    # 3. If the user does not exist, create them
    click.echo(f'Creating master user for {master_email}...')
    
    # We use your model's setters and methods to handle encryption and hashing
    new_master_user = User(
        first_name="Master",
        last_name="Admin",
        is_master=True,
        is_registered=True,  # A master user should be considered registered
        institution="System Administration"
    )
    
    # These setters handle the encryption and hashing for you
    new_master_user.email = master_email
    new_master_user.set_password(master_password)
    
    db.session.add(new_master_user)
    db.session.commit()
    
    click.echo('Master user created successfully.')

def init_app(app):
    """Register the command with the Flask app."""
    app.cli.add_command(seed_master_command)