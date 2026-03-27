"""
Tests for the core rule engine — the differentiating logic of MockAPI Pro.
"""
import pytest
from unittest.mock import MagicMock
from endpoints.models import ResponseRule


def make_rule(source, field, operator, value=''):
    rule = MagicMock(spec=ResponseRule)
    rule.source = source
    rule.field = field
    rule.operator = operator
    rule.value = value
    rule.evaluate = ResponseRule.evaluate.__get__(rule, ResponseRule)
    return rule


class TestResponseRuleEvaluate:
    def _eval(self, source, field, operator, value, request_data):
        rule = ResponseRule(source=source, field=field, operator=operator, value=value)
        return rule.evaluate(request_data)

    def test_eq_match(self):
        assert self._eval('body', 'type', 'eq', 'admin', {'body': {'type': 'admin'}}) is True

    def test_eq_no_match(self):
        assert self._eval('body', 'type', 'eq', 'admin', {'body': {'type': 'user'}}) is False

    def test_neq(self):
        assert self._eval('query', 'page', 'neq', '1', {'query': {'page': '2'}}) is True

    def test_contains(self):
        assert self._eval('body', 'email', 'contains', '@example', {'body': {'email': 'user@example.com'}}) is True

    def test_starts_with(self):
        assert self._eval('header', 'authorization', 'starts_with', 'Bearer', {'header': {'authorization': 'Bearer token123'}}) is True

    def test_gt(self):
        assert self._eval('body', 'age', 'gt', '18', {'body': {'age': 25}}) is True

    def test_lt(self):
        assert self._eval('body', 'age', 'lt', '18', {'body': {'age': 10}}) is True

    def test_exists_true(self):
        assert self._eval('body', 'user_id', 'exists', '', {'body': {'user_id': 42}}) is True

    def test_exists_false(self):
        assert self._eval('body', 'user_id', 'exists', '', {'body': {}}) is False

    def test_not_exists(self):
        assert self._eval('body', 'token', 'not_exists', '', {'body': {}}) is True

    def test_path_param(self):
        assert self._eval('path', 'id', 'eq', '42', {'path': {'id': '42'}}) is True

    def test_missing_field_returns_false(self):
        assert self._eval('body', 'nonexistent', 'eq', 'value', {'body': {}}) is False

    def test_gt_invalid_type(self):
        assert self._eval('body', 'name', 'gt', '5', {'body': {'name': 'alice'}}) is False


class TestMatchResponse:
    """Integration test for the match_response function."""

    def test_returns_default_when_no_rules_match(self):
        from unittest.mock import patch, MagicMock
        from endpoints.engine import match_response

        default_resp = MagicMock()
        default_resp.is_default = True
        default_resp.rules = MagicMock()
        default_resp.rules.all.return_value = []
        default_resp.rules.prefetch_related.return_value = default_resp.rules

        endpoint = MagicMock()
        endpoint.responses.prefetch_related.return_value.order_by.return_value = [default_resp]

        result = match_response(endpoint, {'body': {}, 'query': {}, 'header': {}, 'path': {}})
        assert result == default_resp

    def test_returns_first_matching_rule_response(self):
        from endpoints.engine import match_response
        from unittest.mock import MagicMock

        # Build a non-default response with one passing rule
        matching_rule = ResponseRule(source='body', field='role', operator='eq', value='admin')
        matching_resp = MagicMock()
        matching_resp.is_default = False
        matching_resp.rules.all.return_value = [matching_rule]
        matching_resp.rules.prefetch_related.return_value = matching_resp.rules

        default_resp = MagicMock()
        default_resp.is_default = True

        endpoint = MagicMock()
        endpoint.responses.prefetch_related.return_value.order_by.return_value = [matching_resp, default_resp]

        request_data = {'body': {'role': 'admin'}, 'query': {}, 'header': {}, 'path': {}}
        result = match_response(endpoint, request_data)
        assert result == matching_resp
