# Creating dump of reservations, guests and voucher

1. Open connection aws ssm start-session --target i-04ba61ae64711b5f0 --document-name AWS-StartPortForwardingSession --parameters '{"localPortNumber":["7435"],"portNumber":["5432"]}'
2. Dump reservations: psql --host localhost --port 7435 --username nelson --csv nelson < reservation_sql_export.sql > data/reservations_20231006.csv
3. Dump guests: psql --host localhost --port 7435 --username nelson --csv nelson < guest_sql_export.sql > data/guests_20231006.csv
4. Dump vouchers: psql --host localhost --port 7435 --username nelson --csv nelson < voucher_sql_export.sql > data/vouchers_20231006.csv
5. Dump prices: psql --host localhost --port 7435 --username nelson --csv nelson < total_price_sql_export.sql > data/prices_20231006.csv