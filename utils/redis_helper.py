from django.conf import settings
from utils.redis_client import RedisClient
from utils.redis_serializers import DjangoModelSerializer


class RedisHelper:

    @classmethod
    def _load_objects_to_cache(cls, key, objects):
        conn = RedisClient.get_connection()

        serialized_list = []
        # 超过 REDIS_LIST_LENGTH_LIMIT 会访问数据库
        for obj in objects[:settings.REDIS_LIST_LENGTH_LIMIT]:
            serialized_data = DjangoModelSerializer.serialize(obj)
            serialized_list.append(serialized_data)

        if serialized_list:
            # * 表示展开一个一个放进去
            conn.rpush(key, *serialized_list)
            conn.expire(key, settings.REDIS_KEY_EXPIRE_TIME)

    @classmethod
    def load_objects(cls, key, queryset):
        conn = RedisClient.get_connection()

        # 如果cache hit，则直接拿出来，然后返回
        if conn.exists(key):
            serialized_list = conn.lrange(key, 0, -1) # 取出list of string
            objects = []
            for serialized_data in serialized_list:
                deserialized_obj = DjangoModelSerializer.deserialize(
                    serialized_data)
                objects.append(deserialized_obj)
            return objects

        # cache miss - maybe expire
        cls._load_objects_to_cache(key, queryset)

        # 转换为 list 的原因是保持返回类型的统一，因为存在 redis 里的数据是 list 的形式
        return list(queryset)

    @classmethod
    def push_object(cls, key, obj, queryset):
        conn = RedisClient.get_connection()
        if not conn.exists(key):
            # 如果 key 不存在，直接从数据库里 load
            # 就不走单个 push 的方式加到 cache 里了
            cls._load_objects_to_cache(key, queryset)
            return
        serialized_data = DjangoModelSerializer.serialize(obj)
        conn.lpush(key, serialized_data)
        # keep data [0, settings.REDIS_LIST_LENGTH_LIMIT]
        conn.ltrim(key, 0, settings.REDIS_LIST_LENGTH_LIMIT - 1)
