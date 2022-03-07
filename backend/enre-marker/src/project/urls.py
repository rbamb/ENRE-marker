from django.urls import path, re_path

from . import views

app_name = 'project'
urlpatterns = [
    path('', views.get_all_projects, name='get_all_projects'),
    path('<int:pid>', views.view_a_project, name="view_a_project"),
    path('<int:pid>/stats', views.statistic, name='view a project\'s statistics'),
    path('<int:pid>/claim', views.claim_a_project, name='claim a project'),
    path('<int:pid>/file/<int:fid>/entity', views.entity_operation, name='get or post entity operations'),
    path('<int:pid>/file/<int:fid>/relation', views.relation_operation, name='get or post relation operations'),
    path('<int:pid>/entity/<int:eid>/cascade', views.entity_cascade_check, name='get cascading count for an entity')
]
