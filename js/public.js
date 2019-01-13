/**
 * @author      OA Wu <comdan66@gmail.com>, Yoga Lin <blueandhack@gmail.com>
 * @copyright   Copyright (c) 2015 - 2018, OAF2E
 * @license     http://opensource.org/licenses/MIT  MIT License
 * @link        https://www.ioa.tw/
 */

$(function() {
  var params = {
    val: {},
    init: function() {
      window.location.hash
        .substr(1)
        .split('&')
        .forEach(function(val) {
          var splitter = val.split('=');
          if (splitter.length != 2) return;
          var k = decodeURIComponent(splitter[0]),
            v = decodeURIComponent(splitter[1]);
          if (k.slice(-2) == '[]')
            if (!params.val[(k = k.slice(0, -2))]) params.val[k] = [v];
            else params.val[k].push(v);
          else params.val[k] = v;
        });

      params.val.n = params.val.n ? params.val.n : '';
      params.val.t = params.val.t ? params.val.t : '';
      params.val.q = params.val.q ? params.val.q : '';
    },
    update: function(k, v) {
      if (typeof params.val[k] === 'undefined') return;

      params.val[k] = v;

      // if (k == 'n')
      //   params.val.t = '';

      if (k == 'q') {
        params.val.n = '';
        params.val.t = '';
      }

      var str = [];
      for (var t in params.val) str.push(t + '=' + params.val[t]);

      window.location.hash = str.join('&');
    }
  };

  var load = {
    $el: $('#load'),
    init: function() {
      $.get('api_project.json?t=' + new Date().getTime())
        .done(load.render)
        .fail(function() {
          load.render({
            name: 'API File',
            description: '',
            version: '0.0.0'
          });
        });
    },
    render: function(r) {
      $('title').text(r.name);
      load.$el.append(
        $('<div />')
          .append($('<h1 />').text(r.name))
          .append($('<p />').text(r.description))
          .append(
            $('<div />')
              .append($('<i />'))
              .append($('<i />'))
              .append($('<i />'))
          )
          .append($('<span />').text('Version：v' + r.version + ''))
      );
    },
    hide: function(cb) {
      if (!load.$el) return;
      load.$el.addClass('hide');
      setTimeout(function() {
        load.$el.remove();
        load.$el = null;
        cb && cb();
      }, 375);
    }
  };

  var main = {
    $el: $('#main'),
    $tabs: null,
    $panels: null,
    $format: null,
    init: function() {
      var $tmp = $('<div />');
      main.$el.empty().append($tmp);
      main.$el = $tmp;
    },
    render: function(obj) {
      main.$el.empty();

      var filters = { name: '', title: '', description: '', permission: [] };
      for (var filter in filters)
        if (typeof obj[filter] === 'undefined') obj[filter] = filters[filter];

      var $header = $('<header />')
        .append(
          $('<h1 />')
            .attr('data-title', obj.name)
            .text(obj.title)
        )
        .append($('<section />').html(obj.description));

      var $important = $('<div />')
        .addClass('important')
        .append(
          obj.permission.map(function(t) {
            return $('<div />')
              .append($('<span />').text(t.name))
              .append($('<div />').text(t.title))
              .append($(t.description));
          })
        );
      var $url = $('<div />')
        .addClass('url')
        .attr('data-type', obj.type)
        .append($('<pre />').text(obj.url));

      var formats = {
        header: { title: 'Header', d4: 'Header', v: 'h' },
        parameter: { title: 'Parameters', d4: 'Parameter', v: 'p' },
        success: { title: 'Success', d4: 'Success 200', v: 's' },
        error: { title: 'Error', d4: 'Error 4xx', v: 'e' }
      };

      main.$tabs = [];
      main.$panels = [];

      for (var format in formats)
        if (typeof obj[format] !== 'undefined') {
          main.$tabs.push(formats[format]);
          main.$panels.push({
            d4: formats[format].d4,
            fields:
              typeof obj[format].fields === 'undefined'
                ? {}
                : obj[format].fields,
            examples:
              typeof obj[format].examples === 'undefined'
                ? []
                : obj[format].examples
          });
        }

      main.$tabs = $(
        main.$tabs.map(function(t) {
          return $('<a />')
            .attr('data-name', t.v)
            .text(t.title)
            .click(function() {
              params.update('t', $(this).attr('data-name'));
              main.$format.attr('data-i', $(this).index() + 1);
            });
        })
      ).map($.fn.toArray);
      main.$panels = $(
        main.$panels.map(function(t) {
          var $div = $('<div />');

          var fields = [];

          for (var field in t.fields)
            fields.push(
              $.extend(t.fields[field], { title: t.d4 == field ? '' : field })
            );

          fields.sort(function(a, b) {
            return a.title > b.title;
          });
          $div.append(
            fields.map(function(field) {
              var $table = $('<div />')
                .addClass('table')
                .append(
                  $('<table />')
                    .append(
                      $('<thead />').append(
                        $('<tr />')
                          .append(
                            $('<th />')
                              .addClass('center')
                              .addClass('is-need')
                              .text('Required')
                          )
                          .append(
                            $('<th />')
                              .addClass('key')
                              .text('Key')
                          )
                          .append(
                            $('<th />')
                              .addClass('type')
                              .text('Type')
                          )
                          .append(
                            $('<th />')
                              .addClass('desc')
                              .text('Description')
                          )
                      )
                    )
                    .append(
                      $('<tbody />').append(
                        field.map(function(u) {
                          return $('<tr />')
                            .append(
                              $('<td />').append(
                                $('<span />').addClass(
                                  u.optional ? 'maybe' : 'need'
                                )
                              )
                            )
                            .append($('<td />').text(u.field))
                            .append($('<td />').text(u.type))
                            .append(
                              $('<td />').html(
                                u.allowedValues
                                  ? u.description +
                                      '<br><br>Allowed values: <code>' +
                                      u.allowedValues +
                                      '</code>'
                                  : u.description
                              )
                            );
                        })
                      )
                    )
                );
              return field.title.length
                ? $('<h3 />')
                    .text(field.title)
                    .add($table)
                : $table;
            })
          );

          $div.append(
            t.examples.map(function(u) {
              var $pre = $('<pre />')
                .addClass('prettyprint')
                .addClass('language-' + u.type)
                .addClass('sample')
                .text(u.content);
              return t.examples.length > 1
                ? $('<h3 />')
                    .text(u.title)
                    .add($pre)
                : $pre;
            })
          );

          return $div;
        })
      ).map($.fn.toArray);

      main.$format = $('<div />')
        .addClass('format')
        .append(
          $('<div />')
            .addClass('tabs')
            .append(main.$tabs)
        )
        .append(
          $('<div />')
            .addClass('panels')
            .append(main.$panels)
        );

      // main.$tabs.first ().click ();

      if (
        params.val.t.length &&
        main.$tabs.filter('[data-name="' + params.val.t + '"]').length
      )
        main.$tabs
          .filter('[data-name="' + params.val.t + '"]')
          .first()
          .click();
      else main.$tabs.first().click();

      main.$el
        .append($header)
        .append($important)
        .append($url)
        .append(main.$format);

      PR.prettyPrint();
    }
  };

  var menu = {
    $el: $('#menu'),
    $search: null,
    $apis: null,
    $links: null,
    apis: null,
    projectData: null,

    init: function() {
      menu.$el.empty();
      menu.$search = $('<form />')
        .attr('id', 'search')
        .append(
          $('<input />')
            .val(params.val.q)
            .attr('placeholder', 'Searching？')
            .prop('required', true)
            .keyup(function() {
              params.update(
                'q',
                $(this)
                  .val()
                  .trim()
              );
              menu.filter(params.val.q);
            })
        )
        .submit(function() {
          return false;
        });

      menu.$apis = $('<div />').attr('id', 'apis');
      menu.$el.append(menu.$search);
      menu.$el.append(menu.$apis);

      $.get('api_project.json?t=' + new Date().getTime())
        .done(function(r) {
          menu.projectData = r;
        })
        .fail(function() {
          menu.projectData = [];
        });

      if (menu.apis === null)
        $.get('api_data.json?t=' + new Date().getTime())
          .done(function(r) {
            menu.apis = r;
            menu.filter(params.val.q);
          })
          .fail(function() {
            menu.apis = [];
            menu.filter(params.val.q);
          });
      else menu.filter(params.val.q);
    },
    filter: function(q) {
      q = typeof q === 'undefined' ? '' : q;
      q = typeof q === 'string' ? q.trim() : q;
      q =
        typeof q === 'object'
          ? $(this)
              .val()
              .trim()
          : q;

      menu.$apis.empty();

      var apis = menu.apis.filter(function(t) {
        var re = new RegExp(q, 'gi');
        return q.length
          ? t.type.match(re) ||
              t.url.match(re) ||
              t.title.match(re) ||
              t.group.match(re)
          : t;
      });
      var groups = {};

      apis.forEach(function(t) {
        if (typeof t.group === 'undefined') t.group = '';

        if (typeof groups[t.group] === 'undefined') groups[t.group] = [];

        groups[t.group].push(t);
      });

      function compareGetAndPost(a, b) {
        if (a.type < b.type || a.title < b.title) return -1;
        if (a.type > b.type || a.title > b.title) return 1;
        return 0;
      }

      Object.keys(groups).forEach(element => {
        groups[element].sort(compareGetAndPost);
      });

      // reorder groups
      const newGroups = {};

      for (const element of menu.projectData.order) {
        if (typeof groups[element] !== 'undefined') {
          newGroups[element] = groups[element];
        }
      }

      Object.keys(groups).forEach(element => {
        if (typeof newGroups[element] === 'undefined') {
          newGroups[element] = groups[element];
        }
      });

      groups = newGroups;

      menu.$el.append(
        $('<footer />')
          .attr('id', 'footer')
          // .text('版型設計 by')
          // .append(
          //   $('<a />')
          //     .attr('href', 'https://www.ioa.tw/f=apidoc')
          //     .attr('target', '_blank')
          //     .text('OA Wu')
          // )
          // .append('，程式碼：')
          // .append(
          //   $('<a />')
          //     .attr(
          //       'href',
          //       'https://github.com/comdan66/OA-apiDoc-Template.git'
          //     )
          //     .attr('target', '_blank')
          //     .text('GitHub')
          // )
          .append(
            $('<a />')
              .attr(
                'href',
                'https://gist.github.com/blueandhack/b12e8567834e0f2f6321581c27fc6407'
              )
              .attr('target', '_blank')
              .text('Changelog')
          )
          .append(
            '<div id="gTime">' + menu.projectData.generator.time + '</div>'
          )
      );

      menu.$links = [];

      for (var group in groups) {
        var tmp = groups[group].map(function(t) {
          return $('<a />')
            .attr('data-name', t.name)
            .attr('data-type', t.type)
            .attr('data-url', t.url)
            .text(t.title)
            .data('obj', t)
            .click(function() {
              params.update('n', $(this).data('name'));
              menu.$links.removeClass('active');
              $(this).addClass('active');
              main.render($(this).data('obj'));
            });
        });
        menu.$apis.append(
          $('<div />')
            .attr('data-title', group)
            .attr('data-cnt', groups[group].length)
            .append(tmp)
        );
        menu.$links.push(tmp);
      }

      menu.$links = $(
        menu.$links.length
          ? menu.$links.reduce(function(p, n) {
              return p.concat(n);
            })
          : []
      ).map($.fn.toArray);

      if (!menu.$links.length) {
        menu.$apis.attr('data-tip', 'Can not find the API');
        main.$el.attr('data-tip', 'Can not find the API details');
      } else {
        menu.$apis.removeAttr('data-tip');
        main.$el.removeAttr('data-tip');

        if (
          params.val.n.length &&
          menu.$links.filter('[data-name="' + params.val.n + '"]').length
        )
          menu.$links
            .filter('[data-name="' + params.val.n + '"]')
            .first()
            .click();
        else menu.$links.first().click();
      }
      load.hide(function() {});
    }
  };

  params.init();
  load.init();
  main.init();
  menu.init();

  $(window).keydown(function(e) {
    var i = parseInt(main.$format.attr('data-i'));
    var l = main.$tabs.length;

    if (e.keyCode == 38) {
      var $tmp = menu.$links.filter('.active').prev();
      if ($tmp.length) return $tmp.click();

      $tmp = menu.$links
        .filter('.active')
        .parent()
        .prev();
      if ($tmp.length)
        return $tmp
          .find('>*')
          .last()
          .click();

      $tmp = menu.$apis.find('>*').last();
      return $tmp
        .find('>*')
        .last()
        .click();
    }
    if (e.keyCode == 40) {
      var $tmp = menu.$links.filter('.active').next();
      if ($tmp.length) return $tmp.click();

      $tmp = menu.$links
        .filter('.active')
        .parent()
        .next();
      if ($tmp.length)
        return $tmp
          .find('>*')
          .first()
          .click();

      $tmp = menu.$apis.find('>*').first();
      return $tmp
        .find('>*')
        .first()
        .click();
    }

    if (e.keyCode == 39) {
      main.$format.attr('data-i', ++i > l ? (i = 1) : i);
      params.update('t', main.$tabs.eq(i - 1).attr('data-name'));
    }

    if (e.keyCode == 37) {
      main.$format.attr('data-i', --i < 1 ? (i = l) : i);
      params.update('t', main.$tabs.eq(i - 1).attr('data-name'));
    }
  });
});
