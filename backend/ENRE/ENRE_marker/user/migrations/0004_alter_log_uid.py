# Generated by Django 3.2.8 on 2021-11-15 09:26

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0003_alter_login_gen_time'),
    ]

    operations = [
        migrations.AlterField(
            model_name='log',
            name='uid',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='user.user'),
        ),
    ]