import psycopg2
import os

def create_dbs():
    print("create_dbs: let's go.")
    django_settings = __import__(os.environ['DJANGO_SETTINGS_MODULE'], fromlist='DATABASES')
    print("create_dbs: got settings.")
    databases = django_settings.DATABASES
    for name, db in databases.iteritems():
        host = db['HOST']
        user = db['USER']
        password = db['PASSWORD']
        port = db['PORT']
        db_name = db['NAME']
        print 'creating database %s on %s' % (db_name, host)
        con = psycopg2.connect(host=host, user=user, password=password, port=port, database='postgres')
        con.set_isolation_level(0)
        cur = con.cursor()
        try:
            cur.execute('CREATE DATABASE %s' % db_name)
        except psycopg2.ProgrammingError as detail:
            print detail
            print 'moving right along...'

if __name__ == '__main__':
    print("create_dbs start")
    create_dbs()
    print("create_dbs all done")
