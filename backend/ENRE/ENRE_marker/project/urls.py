from django.urls import path, re_path

from . import views

app_name = 'project'
urlpatterns = [
    path('', views.get_all_projects, name='get_all_projects'),
    # path('show_files/', views.show_files, name='show_files'),
    # path('load_file/', views.load_file, name='load_file'),
    path('<int:pid>', views.view_a_project, name="view_a_project"),
    path('<int:pid>/claim', views.claim_a_project, name='claim a project'),
    path('<int:pid>/file/<int:fid>/entity', views.entity_operation, name='get or post entity operations'),
    path('<int:pid>/file/<int:fid>/relation', views.relation_operation, name='get or post relation operations'),

]
