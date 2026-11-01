# Jalali calendar is a private core patch

Each workspace member gets a Calendar setting (Gregorian or Jalali) that covers both how dates are displayed and the date pickers. Date rendering lives in core `twenty-front`, so an app can't add this. It's the only core change in this fork. Keep it in its own clearly named commits so rebasing onto upstream stays manageable. It was deliberately not sent upstream as a pull request.
