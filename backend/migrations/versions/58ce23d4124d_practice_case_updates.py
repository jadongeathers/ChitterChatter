"""Practice case updates

Revision ID: 58ce23d4124d
Revises: ece3f71f4d7f
Create Date: 2025-06-28 14:21:30.721347

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '58ce23d4124d'
down_revision = 'ece3f71f4d7f'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('practice_cases', schema=None) as batch_op:
        batch_op.add_column(sa.Column('target_language', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('situation_instructions', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('curricular_goals', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('key_items', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('behavioral_guidelines', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('proficiency_level', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('instructor_notes', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('is_draft', sa.Boolean(), nullable=True))
        batch_op.alter_column('system_prompt',
               existing_type=sa.TEXT(),
               nullable=True)
        batch_op.drop_column('goals')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('practice_cases', schema=None) as batch_op:
        batch_op.add_column(sa.Column('goals', sa.TEXT(), autoincrement=False, nullable=True))
        batch_op.alter_column('system_prompt',
               existing_type=sa.TEXT(),
               nullable=False)
        batch_op.drop_column('is_draft')
        batch_op.drop_column('instructor_notes')
        batch_op.drop_column('proficiency_level')
        batch_op.drop_column('behavioral_guidelines')
        batch_op.drop_column('key_items')
        batch_op.drop_column('curricular_goals')
        batch_op.drop_column('situation_instructions')
        batch_op.drop_column('target_language')

    # ### end Alembic commands ###
