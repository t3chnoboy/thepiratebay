gulp       = require 'gulp'
coffee     = require 'gulp-coffee'

gulp.task 'compile', ->
  gulp.src './src/**/*.coffee'
    .pipe coffee bare: yes
    .pipe gulp.dest './'

gulp.task 'watch', ->
  gulp.watch './src/**/*.coffee', ['compile']

gulp.task 'default', ['compile', 'watch']
