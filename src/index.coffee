request = require 'request'
cheerio = require 'cheerio'
zlib    = require 'zlib'
Promise = require('es6-promise').Promise

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
search = (title, opts = {}, cb) ->

  query =
    encoding: null
    url: baseUrl + '/s/'
    qs:
      q: title || ''
      category: opts.category || '0'
      page: opts.page || '0'
      orderby: opts.orderBy || '99'

  parsePage query, parseResults, cb


topTorrents = (category = 'all', cb) ->
  parsePage (baseUrl + '/top/' + category), parseResults, cb


recentTorrents = (cb) ->
  parsePage (baseUrl + '/recent'), parseResults, cb


getCategories = (cb) ->
  parsePage (baseUrl + '/recent'), parseCategories, cb


parsePage = (url, parse, cb) ->

  if typeof cb is 'function'
    request (url), (err, resp, body) ->
      cb err if err?
      cb body if resp.statusCode isnt 200
      zlib.gunzip body, (err, unzipped) ->
        cb err if err?
        results = parse unzipped.toString()
        cb null, results

  return new Promise (resolve, reject) ->
    request (url), (err, resp, body) ->
      reject err if err?
      reject body if resp.statusCode isnt 200
      zlib.gunzip body, (err, unzipped) ->
        reject err if err?
        results = parse unzipped.toString()
        resolve results

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
    seeders = $(@).find('td[align="right"]').first().text()
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


exports.search = search
exports.topTorrents = topTorrents
exports.recentTorrents = recentTorrents
exports.getCategories = getCategories
