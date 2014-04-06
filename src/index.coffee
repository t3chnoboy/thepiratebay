request = require 'co-request'
cheerio = require 'cheerio'
co = require 'co'

baseUrl = 'http://thepiratebay.se'

###
#opts:
#  category
#    0   - all
#    101 - 699
#  page
#    0 - 99
#  orderBy
#     1  - name desc
#     2  - name asc
#     3  - date desc
#     4  - date asc
#     5  - size desc
#     6  - size asc
#     7  - seeds desc
#     8  - seeds asc
#     9  - leeches desc
#     10 - leeches asc
###
search = (title, opts = {}) -->
  query =
    url: baseUrl + '/s/'
    qs:
      q: title || ''
      category: opts.category || '0'
      page: opts.page || '0'
      orderBy: opts.orderBy || '99'
  response = yield request query
  results = parseResults response.body
  return results


topTorrents = (category = 'all') -->
  response = yield request (baseUrl + '/top/' + category)
  results = parseResults response.body
  return results


recentTorrents = -->
  response = yield request (baseUrl + '/recent')
  results = parseResults response.body
  return results


parseCategories = (categoriesHTML) ->
  $ = cheerio.load categoriesHTML
  categoriesContainer = $('select#category optgroup')
  currentCategoryId = 0

  categories = categoriesContainer.map (elem) ->
    currentCategoryId += 100

    category =
      name: $(@).attr 'label'
      id: currentCategoryId + ''
      subcategories: []

    $(@).find('option').each (opt) ->
      subcategory =
        id: $(@).attr 'value'
        name: $(@).text()
      category.subcategories.push subcategory

    return category

  return categories.get()


parseResults = (resultsHTML) ->
  $ = cheerio.load resultsHTML
  rawResults = $('table#searchResult tr:has(a.detLink)')

  results = rawResults.map (elem) ->
    name = $(@).find('a.detLink').text()
    uploadDate = $(@).find('font').text().match(/Uploaded\s(?:<b>)?(.+?)(?:<\/b>)?,/)[1]
    size = $(@).find('font').text().match(/Size (.+?),/)[1]
    seeders = $(@).find('td[align="right"]').text()
    leechers = $(@).find('td[align="right"]').next().text()
    link = baseUrl + $(@).find('div.detName a').attr 'href'
    magnetLink = $(@).find('a[title="Download this torrent using magnet"]').attr 'href'
    torrentLink = $(@).find('a[title="Download this torrent"]').attr 'href'
    category =
      id: $(@).find('center a').first().attr('href').match(/\/browse\/(\d+)/)[1]
      name: $(@).find('center a').first().text()
    subcategory =
      id: $(@).find('center a').last().attr('href').match(/\/browse\/(\d+)/)[1]
      name: $(@).find('center a').last().text()

    result =
      name: name
      size: size
      link: link
      category: category
      seeders: seeders
      leechers: leechers
      uploadDate: uploadDate
      magnetLink: magnetLink
      subcategory: subcategory
      torrentLink: torrentLink

  return results.get()


getCategories = -->
  response = yield request (baseUrl + '/recent')
  categories = parseCategories response.body
  return categories

exports.search = search
exports.topTorrents = topTorrents
exports.recentTorrents = recentTorrents
exports.getCategories = getCategories
