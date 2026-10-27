/**
 * Microsoft Clarity — project ID is injected when you run `npm run dev` / `npm run build`
 * (see NEXT_PUBLIC_CLARITY_PROJECT_ID in backend/.env). Get the ID from Clarity → Get tracking code.
 */
;(function () {
  var id = '__CLARITY_PROJECT_ID__'
  if (!id) return
  ;(function (c, l, a, r, i, t, y) {
    c[a] =
      c[a] ||
      function () {
        ;(c[a].q = c[a].q || []).push(arguments)
      }
    t = l.createElement(r)
    t.async = 1
    t.src = 'https://www.clarity.ms/tag/' + i
    y = l.getElementsByTagName(r)[0]
    y.parentNode.insertBefore(t, y)
  })(window, document, 'clarity', 'script', id)
})()
