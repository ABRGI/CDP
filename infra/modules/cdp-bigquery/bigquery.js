var matrix = [];
function levenshteinDistance(s1, s2, maxDistance) {
  if (s1 == null) return 0;
  if (s2 == null) return 0;
  if (s1.length == 0) return s2.length;
  if (s2.length == 0) return s1.length;
  if (Math.abs(s1.length - s2.length) > maxDistance) return maxDistance + 1

  var i;
  for (i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  var j;
  for (j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  for (i = 1; i <= s2.length; i++) {
    var min = matrix[i][0]
    for (j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) == s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1));
      }
      min = min > matrix[i][j] ? matrix[i][j] : min
    }
    if (min > maxDistance) return maxDistance + 1
  }
  return matrix[s2.length][s1.length]
}

function mapVoucherCategory(keys) {
  if (!keys.length) {
    return "No vouchers"
  }
  for (const key of keys) {
    if (key.key.indexOf("NSN") !== -1) {
      return "NSN"
    }
  }
  return "Some"
}

function mapVoucherCategoryFromReservation(keys) {
  if (!keys.length) {
    return "No vouchers"
  }
  for (const key of keys) {
    if (key.indexOf("NSN") !== -1) {
      return "NSN"
    }
  }
  return "Some"
}