from django.db import models

class Teacher(models.Model):
    name = models.CharField(max_length=200)
    # age = models.IntegerField(default=18)
    email = models.EmailField(null=True)
    date_of_birth = models.DateTimeField(null=True)

    def __str__(self):
        return f'{self.name}, {self.age}'