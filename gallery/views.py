import base64
from django.core.files.base import ContentFile
from django.shortcuts import render, redirect
from .models import Asset
from .forms import AssetForm
from django.contrib import messages

def home(request):
    
     # 1. Получаем параметры из URL (GET-запроса)
    search_query = request.GET.get('q', '')
    ordering = request.GET.get('ordering', 'new')
    
    # 2. Базовый запрос: Берем ВСЕ
    assets = Asset.objects.all()
    
    # 3. Применяем поиск (если пользователь что-то ввел)
    if search_query:
        assets = assets.filter(title__icontains=search_query)
    
    # 4. Применяем сортировку
    if ordering == 'old':
        assets = assets.order_by('created_at')
    elif ordering == 'name':
        assets = assets.order_by('title')
    else:
        assets = assets.order_by('-created_at')

    # 5. Отдаем результат
    context_data = {
        'page_title': 'Главная Галерея',
        'assets': assets,
    }

    return render(request, 'gallery/index.html', context_data)

def about(request):
    return render(request, 'gallery/about.html')

def upload(request):
    if request.method == 'POST':
        form = AssetForm(request.POST, request.FILES)
        if form.is_valid():
            # 1. Создаем объект, но пока НЕ сохраняем в базу (commit=False)
            new_asset = form.save(commit=False)
            
            # 2. Обрабатываем картинку из скрытого поля
            image_data = request.POST.get('image_data')
            
            if image_data:
                format, imgstr = image_data.split(';base64,') 
                ext = format.split('/')[-1]
                
                # Декодируем текст в байты
                data = base64.b64decode(imgstr)
                
                # Создаем имя файла
                file_name = f"{new_asset.title}_thumb.{ext}"
                
                # Сохраняем байты в поле image
                new_asset.image.save(file_name, ContentFile(data), save=False)
            # 3. Финальное сохранение в БД
            new_asset.save()
            
            return redirect('home')
    else:
        form = AssetForm()
    return render(request, 'gallery/upload.html', {'form': form})