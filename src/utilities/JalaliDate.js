// Pure-JS Gregorian-to-Jalali (Shamsi) calendar conversion - the same
// standard 33-year-cycle arithmetic algorithm as the Flutter client's own
// JalaliDate (lib/src/utils/jalali_date.dart), ported here faithfully so
// both clients format a date identically rather than each inventing its
// own. No npm package dependency, for the same reason the Flutter side
// avoids one: no risk of an unexpected API surface on whatever happens
// to be installed.

const monthNames = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
]

function toJalali(date) {
  const gDaysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  const gy = date.getFullYear()
  const gm = date.getMonth() + 1
  const gd = date.getDate()

  let jy = gy <= 1600 ? 0 : 979
  const gy2 = gy - (gy <= 1600 ? 621 : 1600)
  const gy3 = gm > 2 ? gy2 + 1 : gy2
  let days =
    365 * gy2 +
    Math.floor((gy3 + 3) / 4) -
    Math.floor((gy3 + 99) / 100) +
    Math.floor((gy3 + 399) / 400) -
    80 +
    gd +
    gDaysInMonth[gm - 1]

  jy += 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }

  let jm, jd
  if (days < 186) {
    jm = 1 + Math.floor(days / 31)
    jd = 1 + (days % 31)
  } else {
    jm = 7 + Math.floor((days - 186) / 30)
    jd = 1 + ((days - 186) % 30)
  }

  return { year: jy, month: jm, day: jd }
}

function toPersianDigits(n) {
  const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n)
    .split('')
    .map((d) => (d >= '0' && d <= '9' ? persian[parseInt(d)] : d))
    .join('')
}

// "۳ مرداد ۱۴۰۵ - ۱۴:۰۵" - matches Flutter's JalaliDate.formatWithTime
// exactly. Accepts either a Date or an ISO date string (API responses
// come back as strings).
export function formatWithTime(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (isNaN(date.getTime())) return ''
  const j = toJalali(date)
  const day = toPersianDigits(j.day)
  const year = toPersianDigits(j.year)
  const hour = toPersianDigits(date.getHours()).padStart(2, '۰')
  const minute = toPersianDigits(date.getMinutes()).padStart(2, '۰')
  return `${day} ${monthNames[j.month - 1]} ${year} - ${hour}:${minute}`
}
