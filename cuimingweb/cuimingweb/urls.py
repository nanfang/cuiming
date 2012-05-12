from django.conf.urls import patterns, include, url
from cuiming.views import hello_view
# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'cuimingweb.views.home', name='home'),
    # url(r'^cuimingweb/', include('cuimingweb.foo.urls')),

    url(r'^$', hello_view, name='hello_page'),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
