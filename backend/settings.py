# settings.py
DATABASES = {
    'default': dj_database_url.config(default=os.environ.get('postgresql://database_8suu_user:JhWakO3g5BhqleKSRSd87yFw3tOpf5xF@dpg-d3imcvadbo4c73fs18rg-a/database_8suu'))
}
