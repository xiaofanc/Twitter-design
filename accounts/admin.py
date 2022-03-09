from django.contrib import admin
from accounts.models import Teacher

class TeacherAdmin(admin.ModelAdmin):
	list_display = ('id', 'name', 'date_of_birth')

admin.site.register(Teacher, TeacherAdmin)