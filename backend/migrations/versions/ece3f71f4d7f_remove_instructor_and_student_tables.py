"""Remove instructor and student tables

Revision ID: ece3f71f4d7f
Revises: 5204bc908edf
Create Date: 2025-05-30 20:30:58.877148

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ece3f71f4d7f'
down_revision = '5204bc908edf'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('instructors')
    op.drop_table('students')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('students',
    sa.Column('id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['id'], ['users.id'], name='students_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='students_pkey')
    )
    op.create_table('instructors',
    sa.Column('id', sa.INTEGER(), autoincrement=False, nullable=False),
    sa.ForeignKeyConstraint(['id'], ['users.id'], name='instructors_id_fkey'),
    sa.PrimaryKeyConstraint('id', name='instructors_pkey')
    )
    # ### end Alembic commands ###
