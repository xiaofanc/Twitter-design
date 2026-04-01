import base64
from dateutil import parser
from rest_framework.pagination import BasePagination
from rest_framework.response import Response
from django.conf import settings


class EndlessPagination(BasePagination):
    page_size = 20

    def __init__(self):
        super(EndlessPagination, self).__init__()
        self.has_next_page = False

    def to_html(self):
        pass

    @staticmethod
    def encode_cursor(dt):
        """Encode a datetime to an opaque base64 cursor token."""
        return base64.urlsafe_b64encode(
            dt.isoformat().encode('utf-8')
        ).decode('utf-8')

    @staticmethod
    def decode_cursor(cursor_str):
        """Decode a cursor token back to a datetime, or None on failure."""
        try:
            return parser.isoparse(
                base64.urlsafe_b64decode(cursor_str.encode('utf-8')).decode('utf-8')
            )
        except Exception:
            return None

    def paginate_ordered_list(self, reverse_ordered_list, request):
        if 'created_at__gt' in request.query_params:
            created_at__gt = parser.isoparse(
                request.query_params['created_at__gt'])
            objects = []
            for obj in reverse_ordered_list:
                if obj.created_at > created_at__gt:
                    objects.append(obj)
                else:
                    break
            self.has_next_page = False
            return objects

        index = 0
        if 'cursor' in request.query_params:
            cursor_dt = self.decode_cursor(request.query_params['cursor'])
            if cursor_dt:
                for index, obj in enumerate(reverse_ordered_list):
                    if obj.created_at < cursor_dt:
                        break
                else:
                    reverse_ordered_list = []
        self.has_next_page = len(reverse_ordered_list) > index + self.page_size
        return reverse_ordered_list[index: index + self.page_size]

    def paginate_queryset(self, queryset, request, view=None):
        if 'created_at__gt' in request.query_params:
            created_at__gt = request.query_params['created_at__gt']
            queryset = queryset.filter(created_at__gt=created_at__gt)
            self.has_next_page = False
            return queryset.order_by('-created_at')

        if 'cursor' in request.query_params:
            cursor_dt = self.decode_cursor(request.query_params['cursor'])
            if cursor_dt:
                queryset = queryset.filter(created_at__lt=cursor_dt)

        queryset = queryset.order_by('-created_at')[:self.page_size + 1]
        self.has_next_page = len(queryset) > self.page_size
        return queryset[:self.page_size]

    def paginate_cached_list(self, cached_list, request):
        paginated_list = self.paginate_ordered_list(cached_list, request)
        if 'created_at__gt' in request.query_params:
            return paginated_list
        if self.has_next_page:
            return paginated_list
        if len(cached_list) < settings.REDIS_LIST_LENGTH_LIMIT:
            return paginated_list
        # Cache may be incomplete — fall back to DB
        return None

    def get_paginated_response(self, data):
        next_cursor = None
        if self.has_next_page and data:
            last_created_at = data[-1].get('created_at')
            if last_created_at:
                next_cursor = self.encode_cursor(parser.isoparse(str(last_created_at)))
        return Response({
            'next': next_cursor,
            'results': data,
        })
