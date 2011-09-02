"""
Fixes formencode's bug with date conversion
"""

from formencode import Schema, validators, FancyValidator, Invalid
from formencode.schema import SimpleFormValidator
import re

def _(val):
    return val

datetime_module = None
mxDateTime_module = None

def datetime_makedate(module, year, month, day):
    if module.__name__ == 'datetime':
        return module.date(year, month, day)
    else:
        try:
            return module.DateTime(year, month, day)
        except module.RangeError, e:
            raise ValueError(str(e))

def import_datetime(module_type):
    global datetime_module, mxDateTime_module
    module_type = module_type and module_type.lower() or 'datetime'
    if module_type == 'datetime':
        if datetime_module is None:
            import datetime as datetime_module
        return datetime_module
    elif module_type == 'mxdatetime':
        if mxDateTime_module is None:
            from mx import DateTime as mxDateTime_module
        return mxDateTime_module
    else:
        raise ImportError('Invalid datetime module %r' % module_type)

class DateConverter(FancyValidator):
    """
    Validates and converts a string date, like mm/yy, dd/mm/yy,
    dd-mm-yy, etc.  Using ``month_style`` you can support
    ``'mm/dd/yyyy'`` or ``'dd/mm/yyyy'``.  Only these two general
    styles are supported.

    Accepts English month names, also abbreviated.  Returns value as a
    datetime object (you can get mx.DateTime objects if you use
    ``datetime_module='mxDateTime'``).  Two year dates are assumed to
    be within 1950-2020, with dates from 21-49 being ambiguous and
    signaling an error.

    Use accept_day=False if you just want a month/year (like for a
    credit card expiration date).

    ::

        >>> d = DateConverter()
        >>> d.to_python('12/3/09')
        datetime.date(2009, 12, 3)
        >>> d.to_python('12/3/2009')
        datetime.date(2009, 12, 3)
        >>> d.to_python('2/30/04')
        Traceback (most recent call last):
            ...
        Invalid: That month only has 29 days
        >>> d.to_python('13/2/05')
        Traceback (most recent call last):
            ...
        Invalid: Please enter a month from 1 to 12
        >>> d.to_python('1/1/200')
        Traceback (most recent call last):
            ...
        Invalid: Please enter a four-digit year after 1899

    If you change ``month_style`` you can get European-style dates::

        >>> d = DateConverter(month_style='dd/mm/yyyy')
        >>> date = d.to_python('12/3/09')
        >>> date
        datetime.date(2009, 3, 12)
        >>> d.from_python(date)
        '12/03/2009'
    """
    ## @@: accepts only US-style dates

    accept_day = True
    # also allowed: 'dd/mm/yyyy'
    month_style = 'mm/dd/yyyy'
    # Use 'datetime' to force the Python 2.3+ datetime module, or
    # 'mxDateTime' to force the mxDateTime module (None means use
    # datetime, or if not present mxDateTime)
    datetime_module = None

    _day_date_re = re.compile(r'^\s*(\d\d?)[\-\./\\](\d\d?|jan|january|feb|febuary|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)[\-\./\\](\d\d\d?\d?)\s*$', re.I)
    _month_date_re = re.compile(r'^\s*(\d\d?|jan|january|feb|febuary|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)[\-\./\\](\d\d\d?\d?)\s*$', re.I)

    _month_names = {
        'jan': 1, 'january': 1,
        'feb': 2, 'febuary': 2,
        'mar': 3, 'march': 3,
        'apr': 4, 'april': 4,
        'may': 5,
        'jun': 6, 'june': 6,
        'jul': 7, 'july': 7,
        'aug': 8, 'august': 8,
        'sep': 9, 'sept': 9, 'september': 9,
        'oct': 10, 'october': 10,
        'nov': 11, 'november': 11,
        'dec': 12, 'december': 12,
        }

    ## @@: Feb. should be leap-year aware (but mxDateTime does catch that)
    _monthDays = {
        1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31,
        9: 30, 10: 31, 11: 30, 12: 31}

    messages = dict(
        badFormat=_('Please enter the date in the form %(format)s'),
        monthRange=_('Please enter a month from 1 to 12'),
        invalidDay=_('Please enter a valid day'),
        dayRange=_('That month only has %(days)i days'),
        invalidDate=_('That is not a valid day (%(exception)s)'),
        unknownMonthName=_('Unknown month name: %(month)s'),
        invalidYear=_('Please enter a number for the year'),
        fourDigitYear=_('Please enter a four-digit year after 1899'),
        wrongFormat=_('Please enter the date in the form %(format)s'))

    def __init__(self, *args, **kw):
        super(DateConverter, self).__init__(*args, **kw)
        if not self.month_style in ('dd/mm/yyyy', 'mm/dd/yyyy'):
            raise TypeError('Bad month_style: %r' % self.month_style)

    def _to_python(self, value, state):
        if self.accept_day:
            return self.convert_day(value, state)
        else:
            return self.convert_month(value, state)

    def convert_day(self, value, state):
        self.assert_string(value, state)
        match = self._day_date_re.search(value)
        if not match:
            raise Invalid(
                self.message('badFormat', state,
                    format=self.month_style), value, state)
        day = int(match.group(1))
        try:
            month = int(match.group(2))
        except (TypeError, ValueError):
            month = self.make_month(match.group(2), state)
        else:
            if self.month_style == 'mm/dd/yyyy':
                pass #month, day = day, month
        year = self.make_year(match.group(3), state)
        if not 1 <= month <= 12:
            raise Invalid(self.message('monthRange', state), value, state)
        if day < 1:
            raise Invalid(self.message('invalidDay', state), value, state)
        if self._monthDays[month] < day:
            raise Invalid(
                self.message('dayRange', state,
                    days=self._monthDays[month]), value, state)
        dt_mod = import_datetime(self.datetime_module)
        try:
            return datetime_makedate(dt_mod, year, month, day)
        except ValueError, v:
            raise Invalid(
                self.message('invalidDate', state,
                    exception=str(v)), value, state)

    def make_month(self, value, state):
        try:
            return int(value)
        except ValueError:
            value = value.lower().strip()
            if value in self._month_names:
                return self._month_names[value]
            else:
                raise Invalid(
                    self.message('unknownMonthName', state,
                        month=value), value, state)

    def make_year(self, year, state):
        try:
            year = int(year)
        except ValueError:
            raise Invalid(self.message('invalidYear', state), year, state)
        if year <= 20:
            year += 2000
        elif 50 <= year < 100:
            year += 1900
        if 20 < year < 50 or 99 < year < 1900:
            raise Invalid(self.message('fourDigitYear', state), year, state)
        return year

    def convert_month(self, value, state):
        match = self._month_date_re.search(value)
        if not match:
            raise Invalid(
                self.message('wrongFormat', state,
                    format='mm/yyyy'), value, state)
        month = self.make_month(match.group(1), state)
        year = self.make_year(match.group(2), state)
        if not 1 <= month <= 12:
            raise Invalid(self.message('monthRange', state), value, state)
        dt_mod = import_datetime(self.datetime_module)
        return datetime_makedate(dt_mod, year, month, 1)

    def _from_python(self, value, state):
        if self.if_empty is not NoDefault and not value:
            return ''
        if self.accept_day:
            return self.unconvert_day(value, state)
        else:
            return self.unconvert_month(value, state)

    def unconvert_day(self, value, state):
        # @@ ib: double-check, improve
        if self.month_style == 'mm/dd/yyyy':
            return value.strftime('%m/%d/%Y')
        else:
            return value.strftime('%d/%m/%Y')

    def unconvert_month(self, value, state):
        # @@ ib: double-check, improve
        return value.strftime('%m/%Y')
