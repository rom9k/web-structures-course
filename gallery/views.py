from django.shortcuts import render
from .models import Asset
def home(request):
    assets = Asset.objects.all()

    context_data = {
        'page_title' : 'Главная Галерея', 
        'assets' : assets, 
    }
    return render(request, 'gallery/index.html', context_data)

def about(request):
    return render(request, 'gallery/about.html')