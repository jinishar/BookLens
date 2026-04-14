from django.urls import path
from . import views

urlpatterns = [
    path('qa/', views.QAView.as_view(), name='qa'),
    path('qa/history/', views.qa_history, name='qa-history'),
    path('books/<int:pk>/generate-insights/', views.GenerateInsightsView.as_view(), name='generate-insights'),
]
