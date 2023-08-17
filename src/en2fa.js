export function en2fa(num) {
    let arr = []
    const persian = { 0: '۰', 1: '۱', 2: '۲', 3: '۳', 4: '۴', 5: '۵', 6: '۶', 7: '۷', 8: '۸', 9: '۹' }
    num.split('').map((number, index) => {
      arr[index] = persian[number]
    })
    return arr.join('')
  }