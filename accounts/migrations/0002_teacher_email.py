# Generated by Django 3.1.3 on 2022-03-08 23:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='teacher',
            name='email',
            field=models.EmailField(max_length=254, null=True),
        ),
    ]
