# *****************************************************************************************
# module used to make query to mariadb
# *****************************************************************************************
import mariadb as my
import logging
import json
import pandas as pd
import os
import time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s]: %(message)s",
    datefmt="%m/%d/%Y %I:%M:%S",
)


class query_manager:
    # connection definition

    def __init__(self):
        try:
            with open("../cfg/config.json") as json_data_file:
                cfg = json.load(json_data_file)
        except Exception as e1:
            logging.info(e1)
            logging.info("trying with other path...")
            try:
                with open("cfg/config.json") as json_data_file:
                    cfg = json.load(json_data_file)
            except Exception as e2:
                logging.error(e2)
                return

        logging.info("config file loaded")


        try:
            pool_size = int(os.environ.get("SPIDERWEB_DB_POOL_SIZE", "4"))
        except ValueError:
            logging.warning("Invalid SPIDERWEB_DB_POOL_SIZE, using default of 4")
            pool_size = 4

        # Retry logic for connection pool - handles DB startup race condition
        max_retries = 30
        retry_delay = 2

        for i in range(max_retries):
            try:
                self.__cnxpool = my.ConnectionPool(
                    host=cfg["mysql"]["host"],
                    user=cfg["mysql"]["user"],
                    passwd=cfg["mysql"]["passwd"],
                    db=cfg["mysql"]["db"],
                    pool_name="spider_pool",
                    pool_size=pool_size,
                    pool_validation_interval=1800
                )
                logging.info("db connection pool created")
                break
            except my.OperationalError as e:
                logging.warning(f"Failed to connect to MariaDB (attempt {i+1}/{max_retries}): {e}")
                if i < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    logging.error("Max retries reached. Could not connect to MariaDB.")
                    raise

    # normal query - now returns (data, row_headers) tuple directly for thread safety
    def qry(self, qs, prepared_statement=False):
        cnx = None
        try:
            cnx = self.__cnxpool.get_connection()
            cursor = cnx.cursor(prepared=prepared_statement)
            cursor.execute(qs)
            data = cursor.fetchall()
            row_headers = [
                x[0] for x in cursor.description
            ]  # this will extract row headers
            cursor.close()
            return data, row_headers
        except Exception as e2:
            logging.error(e2)
            raise
        finally:
            if cnx:
                cnx.close()

    # query with pandas - now returns DataFrame directly for thread safety
    def qry_pd(self, qs):
        cnx = None
        try:
            cnx = self.__cnxpool.get_connection()
            df = pd.read_sql(qs, con=cnx)
            return df
        except Exception as e2:
            logging.error(e2)
            raise
        finally:
            if cnx:
                cnx.close()
