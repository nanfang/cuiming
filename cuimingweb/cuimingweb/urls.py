from django.conf.urls import patterns, include, url
from cuiming.views import index_view
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', index_view, name='index_view'),
    url(r'^admin/', include(admin.site.urls)),
)
