(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  btb.User = (function(_super) {

    __extends(User, _super);

    function User() {
      User.__super__.constructor.apply(this, arguments);
    }

    User.prototype.url = "/people/users.json";

    return User;

  })(Backbone.Model);

  btb.UserList = (function(_super) {

    __extends(UserList, _super);

    function UserList() {
      UserList.__super__.constructor.apply(this, arguments);
    }

    UserList.prototype.model = btb.User;

    UserList.prototype.baseUrl = btb.User.prototype.url;

    return UserList;

  })(btb.FilteredPaginatedCollection);

  btb.Letter = (function(_super) {

    __extends(Letter, _super);

    function Letter() {
      Letter.__super__.constructor.apply(this, arguments);
    }

    return Letter;

  })(Backbone.Model);

  btb.LetterList = (function(_super) {

    __extends(LetterList, _super);

    function LetterList() {
      LetterList.__super__.constructor.apply(this, arguments);
    }

    LetterList.prototype.model = btb.Letter;

    LetterList.prototype.baseUrl = "/correspondence/letters.json";

    return LetterList;

  })(btb.FilteredPaginatedCollection);

  btb.Organization = (function(_super) {

    __extends(Organization, _super);

    function Organization() {
      Organization.__super__.constructor.apply(this, arguments);
    }

    return Organization;

  })(Backbone.Model);

  btb.OrganizationList = (function(_super) {

    __extends(OrganizationList, _super);

    function OrganizationList() {
      OrganizationList.__super__.constructor.apply(this, arguments);
    }

    OrganizationList.prototype.model = btb.Organization;

    OrganizationList.prototype.url = "/people/organizations.json";

    return OrganizationList;

  })(btb.FilteredPaginatedCollection);

  btb.UserAdd = (function(_super) {

    __extends(UserAdd, _super);

    function UserAdd() {
      this.cancel = __bind(this.cancel, this);
      this.saveNewUser = __bind(this.saveNewUser, this);
      this.render = __bind(this.render, this);
      UserAdd.__super__.constructor.apply(this, arguments);
    }

    UserAdd.prototype.template = _.template($("#userAdd").html());

    UserAdd.prototype.events = {
      'click span.cancel-add-user-link': 'cancel',
      'click input.save-new-user': 'saveNewUser'
    };

    UserAdd.prototype.defaults = {
      blogger: true,
      managed: true
    };

    UserAdd.prototype.errors = {};

    UserAdd.prototype.initialize = function(options) {
      if ((options != null) && (options.initial != null)) {
        return _.extend(this.defaults, options.initial);
      }
    };

    UserAdd.prototype.render = function() {
      $(this.el).html(this.template({
        defaults: this.defaults,
        errors: this.errors,
        orgs: btb.ORGANIZATIONS
      }));
      return this;
    };

    UserAdd.prototype.saveNewUser = function(event) {
      var key, properties, result, scope, ul, val, _len, _ref,
        _this = this;
      scope = $(".add-user", this.el);
      properties = {
        display_name: $("input[name=display_name]", scope).val(),
        mailing_address: $("textarea[name=mailing_address]", scope).val(),
        blogger: $("input[name=blogger]", scope).is(":checked"),
        managed: $("input[name=managed]", scope).is(":checked"),
        email: $("input[name=email]", scope).val(),
        blog_name: $("input[name=blog_name]", scope).val(),
        org_id: $("[name=org_id]", scope).val()
      };
      if (!properties.mailing_address) {
        this.errors.mailing_address = "Mailing address required";
      } else {
        delete this.errors.mailing_address;
      }
      if (properties.blog_name === properties.display_name) {
        this.errors.blog_name = "Blog name should not be the same as the                writer's name.  Blog names are for unique other names like 'The                Super Duper Blog'.";
      } else {
        delete this.errors.blog_name;
      }
      _ref = this.errors;
      for (val = 0, _len = _ref.length; val < _len; val++) {
        key = _ref[val];
        this.defaults = properties;
        this.render();
        return;
      }
      ul = new btb.UserList();
      result = ul.create(properties, {
        success: function(model) {
          _this.newUser = model;
          return _this.trigger("userAdded", model);
        },
        error: function(model, response) {
          return alert("Server error");
        }
      });
      return result;
    };

    UserAdd.prototype.cancel = function(event) {
      return this.trigger("cancelled");
    };

    return UserAdd;

  })(Backbone.View);

  btb.UserSearch = (function(_super) {

    __extends(UserSearch, _super);

    function UserSearch() {
      this.cancel = __bind(this.cancel, this);
      this.addUser = __bind(this.addUser, this);
      this.chooseResult = __bind(this.chooseResult, this);
      this.turnPage = __bind(this.turnPage, this);
      this.fetchItems = __bind(this.fetchItems, this);
      this.renderItems = __bind(this.renderItems, this);
      this.closeUserSearch = __bind(this.closeUserSearch, this);
      this.openUserSearch = __bind(this.openUserSearch, this);
      this.chooseHighlighted = __bind(this.chooseHighlighted, this);
      this.highlightResult = __bind(this.highlightResult, this);
      this.keyUp = __bind(this.keyUp, this);
      this.render = __bind(this.render, this);
      this.initialize = __bind(this.initialize, this);
      UserSearch.__super__.constructor.apply(this, arguments);
    }

    UserSearch.prototype.template = _.template($("#userSearch").html());

    UserSearch.prototype.emptyRowTemplate = _.template($("#userSearchResultEmpty").html());

    UserSearch.prototype.delay = 100;

    UserSearch.prototype.defaultFilter = {
      per_page: 6,
      blogger: true
    };

    UserSearch.prototype.events = {
      'keyup input.user-chooser-trigger': 'openUserSearch',
      'keyup input.user-search': 'keyUp',
      'click span.pagelink': 'turnPage',
      'click .result': 'chooseResult',
      'click span.add-user-link': 'addUser',
      'click span.cancel-user-search': 'cancel'
    };

    UserSearch.prototype.initialize = function(options) {
      var filter;
      filter = options ? options.filter : {};
      this.userList = new btb.UserList();
      return this.userList.filter = _.extend({}, this.defaultFilter, filter);
    };

    UserSearch.prototype.render = function() {
      $(this.el).html(this.template({
        term: this.userList.filter.q || ""
      }));
      return this;
    };

    UserSearch.prototype.keyUp = function(event) {
      switch (event.keyCode) {
        case 40:
          this.highlightResult(1);
          break;
        case 38:
          this.highlightResult(-1);
          break;
        case 13:
          this.chooseHighlighted();
          break;
        default:
          this.fetchItems();
      }
      return false;
    };

    UserSearch.prototype.highlightResult = function(change) {
      var per_page, too_high, too_low;
      per_page = this.userList.filter.per_page;
      if (this.highlightedIndex == null) this.highlightedIndex = -1;
      this.highlightedIndex = Math.max(0, Math.min(this.highlightedIndex + change, this.userList.pagination.count - 1));
      too_low = this.highlightedIndex < ((this.userList.filter.page || 1) - 1) * this.userList.filter.per_page;
      too_high = this.highlightedIndex >= (this.userList.filter.page || 1) * this.userList.filter.per_page;
      if (too_low || too_high) {
        this.userList.filter.page = parseInt(this.highlightedIndex / this.userList.filter.per_page + 1);
        return this.fetchItems();
      } else {
        $(".results .result", this.el).removeClass("chosen");
        return $($(".results .result", this.el)[this.highlightedIndex % this.userList.filter.per_page]).addClass("chosen");
      }
    };

    UserSearch.prototype.chooseHighlighted = function() {
      return $(".results .result.chosen", this.el).click();
    };

    UserSearch.prototype.openUserSearch = function(event, term) {
      var _this = this;
      term = term || $(event.currentTarget).val();
      this.userList.filter.q = term;
      $(".user-chooser-trigger", this.el).hide();
      $(".user-chooser", this.el).show();
      return setTimeout(function() {
        $(".user-search", _this.el).val(term).focus();
        try {
          return $(".user-search", _this.el).prop({
            selectionStart: term.length,
            selectionEnd: term.length
          });
        } catch (error) {

        }
      }, 0);
    };

    UserSearch.prototype.closeUserSearch = function() {
      this.userList.filter.q = "";
      $(".user-chooser-trigger", this.el).val("").show();
      return $(".user-chooser", this.el).hide();
    };

    UserSearch.prototype.renderItems = function() {
      var _this = this;
      $(".results .result, .results .noresult", this.el).remove();
      if (this.userList.length > 0) {
        this.userList.each(function(user, i) {
          var compact, el;
          compact = new btb.UserCompact({
            user: user,
            term: _this.userList.filter.q
          });
          el = compact.render().el;
          $(el).addClass("result");
          return $(".results", _this.el).append(el);
        });
      } else {
        $(".results", this.el).append(this.emptyRowTemplate());
      }
      return this.renderPagination(this.userList, $(".pagination", this.el));
    };

    UserSearch.prototype.fetchItems = function() {
      var delayed,
        _this = this;
      this.userList.filter.q = $(".user-search", this.el).val().substring(0, 20);
      if (this._timeout != null) window.clearTimeout(this._timeout);
      delayed = function() {
        $(".user-search", _this.el).addClass("loading");
        return _this.userList.fetch({
          success: function() {
            _this.renderItems();
            $(".user-search", _this.el).removeClass("loading");
            if ((_this.highlightedIndex != null) || _this.userList.length === 1) {
              _this.highlightResult(0);
            }
            return _this.trigger("searchDone", _this.userList);
          },
          error: function() {
            return alert("Sever error");
          }
        });
      };
      return this._timeout = window.setTimeout(delayed, this.delay);
    };

    UserSearch.prototype.turnPage = function(event) {
      this.userList.filter.page = this.newPageFromEvent(event);
      return this.fetchItems();
    };

    UserSearch.prototype.chooseResult = function(event) {
      var chosen, userId;
      userId = parseInt($.trim($("input.user-id-raw", event.currentTarget).val()));
      chosen = this.userList.get(parseInt(userId));
      this.closeUserSearch();
      return this.trigger("chosen", chosen);
    };

    UserSearch.prototype.addUser = function(event) {
      var initialName,
        _this = this;
      initialName = $(".user-search", this.el).val();
      initialName = _.map(initialName.split(/\s+/), function(word) {
        return word.substr(0, 1).toUpperCase() + word.substr(1).toLowerCase();
      }).join(" ");
      this.userAdd = new btb.UserAdd({
        initial: {
          display_name: initialName
        }
      });
      this.userAdd.bind("userAdded", function(user) {
        _this.trigger("chosen", user);
        return _this.userAdd.unbind();
      });
      this.userAdd.bind("cancelled", function() {
        _this.userList.filter.q = initialName || "";
        _this.render();
        return _this.userAdd.unbind();
      });
      return $(this.el).html(this.userAdd.render().el);
    };

    UserSearch.prototype.cancel = function(event) {
      this.closeUserSearch();
      return this.trigger("cancelled");
    };

    return UserSearch;

  })(btb.PaginatedView);

  btb.InPlaceUserChooser = (function(_super) {

    __extends(InPlaceUserChooser, _super);

    function InPlaceUserChooser() {
      this.unchoose = __bind(this.unchoose, this);
      this.setUser = __bind(this.setUser, this);
      this.choose = __bind(this.choose, this);
      this.render = __bind(this.render, this);
      InPlaceUserChooser.__super__.constructor.apply(this, arguments);
    }

    InPlaceUserChooser.prototype.template = _.template($("#inPlaceUserChooser").html());

    InPlaceUserChooser.prototype.events = {
      "click .user-name": "unchoose"
    };

    InPlaceUserChooser.prototype.initialize = function(user) {
      var _this = this;
      this.user = user;
      this.userChooser = new btb.UserSearch;
      this.userChooser.bind("chosen", function(model) {
        _this.choose(model);
        return _this.trigger("chosen", model);
      });
      this.userChooser.bind("cancelled", function() {
        if (_this.user != null) return _this.choose(_this.user);
      });
      return $(this.el).addClass("in-place-user-toggle");
    };

    InPlaceUserChooser.prototype.render = function() {
      $(this.el).html(this.template());
      $(this.el).addClass("in-place-user-chooser");
      $(".user-chooser-holder", this.el).html(this.userChooser.render().el);
      if (this.user != null) this.choose(this.user);
      return this;
    };

    InPlaceUserChooser.prototype.choose = function(user) {
      this.user = user;
      $(".user-name", this.el).show().html(_.escapeHTML(user.get("display_name")));
      $(".user-name", this.el).attr("data-user-id", user.id);
      return $(".user-chooser-holder", this.el).hide();
    };

    InPlaceUserChooser.prototype.setUser = function(user) {
      this.choose(user);
      return this.trigger("chosen", user);
    };

    InPlaceUserChooser.prototype.unchoose = function() {
      if (this.user != null) {
        this.userChooser.openUserSearch(null, this.user.get("display_name"));
      }
      $(".user-chooser-holder", this.el).show();
      return $(".user-name", this.el).hide();
    };

    return InPlaceUserChooser;

  })(Backbone.View);

  btb.UserCompact = (function(_super) {

    __extends(UserCompact, _super);

    function UserCompact() {
      this.render = __bind(this.render, this);
      UserCompact.__super__.constructor.apply(this, arguments);
    }

    UserCompact.prototype.template = _.template($("#compactUser").html());

    UserCompact.prototype.stateTemplate = _.template($("#userState").html());

    UserCompact.prototype.initialize = function(options) {
      this.user = options.user;
      return this.term = options.term;
    };

    UserCompact.prototype.render = function() {
      var field, fields, t, terms, _i, _len, _ref;
      fields = this.user.toJSON();
      fields.id_raw = fields.id;
      if (this.term) {
        terms = [
          (function() {
            var _i, _len, _ref, _results;
            _ref = this.term.split(/\s+/);
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              t = _ref[_i];
              if (t !== "") _results.push(t);
            }
            return _results;
          }).call(this)
        ].join("|");
        if (terms.length > 0) {
          _ref = ["display_name", "mailing_address", "id"];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            field = _ref[_i];
            fields[field] = _.escapeHTML(fields[field] + '').replace(new RegExp("(" + terms + ")", "gi"), "<span class='highlight'>$1</span>");
          }
        }
      }
      $(this.el).html(this.template({
        user: fields
      }));
      $(".state", this.el).html(this.stateTemplate({
        user: fields
      }));
      return this;
    };

    return UserCompact;

  })(Backbone.View);

  btb.DocumentTabularList = (function(_super) {

    __extends(DocumentTabularList, _super);

    function DocumentTabularList() {
      this.statusColumn = __bind(this.statusColumn, this);
      this.thumbnailColumn = __bind(this.thumbnailColumn, this);
      DocumentTabularList.__super__.constructor.apply(this, arguments);
    }

    DocumentTabularList.prototype.thumbnailTemplate = _.template($("#userDetailDocumentThumbnails").html());

    DocumentTabularList.prototype.initialize = function(options) {
      var _this = this;
      options.collection = new btb.DocumentList;
      options.collection.filter = options.filter;
      DocumentTabularList.__super__.initialize.call(this, options);
      return this.collection.fetch({
        success: function() {
          return _this.render();
        }
      });
    };

    DocumentTabularList.prototype.thumbnailColumn = function(count) {
      var template;
      template = this.thumbnailTemplate;
      return {
        heading: "Thumbnail",
        render: function(obj) {
          var all_pages, pages;
          all_pages = obj.get('pages' || []);
          pages = all_pages.slice(0, Math.min(count, all_pages.length));
          return template({
            pages: pages,
            show_url: obj.get("url"),
            edit_url: obj.get("edit_url")
          });
        }
      };
    };

    DocumentTabularList.prototype.titleColumn = function() {
      return {
        heading: "Title",
        render: function(obj) {
          return new btb.EditInPlace({
            model: obj,
            field: "title"
          }).render().el;
        }
      };
    };

    DocumentTabularList.prototype.statusColumn = function() {
      var _this = this;
      return {
        heading: "Status",
        render: function(obj) {
          var el;
          el = new btb.UserDetailDocumentStatusControl(obj);
          el.bind("letterAdded", function() {
            return _this.trigger("letterAdded");
          });
          return el.render().el;
        }
      };
    };

    DocumentTabularList.prototype.commentCountColumn = function() {
      return {
        heading: "Replies",
        render: function(obj) {
          return "<a href='" + (_.escapeHTML(obj.get("url"))) + "#comments'>" + (obj.get("comment_count")) + "</a>";
        }
      };
    };

    DocumentTabularList.prototype.noteCountColumn = function() {
      return {
        heading: "Notes",
        render: function(obj) {
          return "<a href='" + (_.escapeHTML(obj.get("edit_url"))) + "'>" + (obj.get("notes_count")) + "</a>";
        }
      };
    };

    DocumentTabularList.prototype.needsAttentionColumn = function() {
      return {
        heading: "Needs attention?",
        render: function(obj) {
          var a, collection, div;
          div = $("<div/>");
          a = $("<a href=#/process/document/" + obj.id + "/>");
          div.append(a);
          collection = new btb.NoteList;
          collection.filter = {
            document_id: obj.id,
            unresolved: 1
          };
          collection.fetch({
            success: function() {
              if (collection.length > 0) {
                a.append("Needs attention");
                div.css("background-color", "#fee");
                return div.after("<p>" + (_.escapeHTML(collection.at(0).get("text"))) + "</p>");
              } else {
                a.append("All good");
                return div.css("background-color", "#efe");
              }
            }
          });
          return div;
        }
      };
    };

    return DocumentTabularList;

  })(btb.TabularList);

  btb.UserDetailDocumentStatusControl = (function(_super) {

    __extends(UserDetailDocumentStatusControl, _super);

    function UserDetailDocumentStatusControl() {
      this.showError = __bind(this.showError, this);
      this.hideLoading = __bind(this.hideLoading, this);
      this.showLoading = __bind(this.showLoading, this);
      this.queuePrintout = __bind(this.queuePrintout, this);
      this.updateAdult = __bind(this.updateAdult, this);
      this.updateStatus = __bind(this.updateStatus, this);
      this.render = __bind(this.render, this);
      UserDetailDocumentStatusControl.__super__.constructor.apply(this, arguments);
    }

    UserDetailDocumentStatusControl.prototype.template = _.template($("#userDetailDocumentStatus").html());

    UserDetailDocumentStatusControl.prototype.events = {
      "change .status": "updateStatus",
      "change .adult": "updateAdult",
      "click .queue-printout": "queuePrintout"
    };

    UserDetailDocumentStatusControl.prototype.initialize = function(doc) {
      return this.doc = doc;
    };

    UserDetailDocumentStatusControl.prototype.render = function() {
      $(this.el).html(this.template({
        adult: this.doc.get("adult")
      }));
      $(".status", this.el).val(_.escapeHTML(this.doc.get("status")));
      return this;
    };

    UserDetailDocumentStatusControl.prototype.updateStatus = function(event) {
      var _this = this;
      this.showLoading();
      return this.doc.save({
        status: $(event.currentTarget).val()
      }, {
        success: function() {
          return _this.hideLoading();
        },
        error: function() {
          return _this.showError();
        }
      });
    };

    UserDetailDocumentStatusControl.prototype.updateAdult = function(event) {
      var _this = this;
      this.showLoading();
      return this.doc.save({
        adult: $(event.currentTarget).is(":checked")
      }, {
        success: function() {
          return _this.hideLoading();
        },
        error: function() {
          return _this.showError();
        }
      });
    };

    UserDetailDocumentStatusControl.prototype.queuePrintout = function() {
      var letter,
        _this = this;
      this.showLoading();
      letter = new btb.Letter;
      return letter.save({
        type: "printout",
        recipient_id: this.doc.get("author").id,
        document_id: this.doc.id
      }, {
        success: function() {
          _this.hideLoading();
          return _this.trigger("letterAdded");
        },
        error: function() {
          alert("Server error.  Letter not saved.");
          return _this.hideLoading();
        }
      });
    };

    UserDetailDocumentStatusControl.prototype.showLoading = function() {
      return $(".loading", this.el).show();
    };

    UserDetailDocumentStatusControl.prototype.hideLoading = function() {
      return $(".loading", this.el).hide();
    };

    UserDetailDocumentStatusControl.prototype.showError = function() {
      $(".loading", this.el).hide();
      return $(".error", this.el).show();
    };

    return UserDetailDocumentStatusControl;

  })(Backbone.View);

  btb.PostTabularList = (function(_super) {

    __extends(PostTabularList, _super);

    function PostTabularList() {
      PostTabularList.__super__.constructor.apply(this, arguments);
    }

    PostTabularList.prototype.initialize = function(userId, docType) {
      if (docType == null) docType = "post";
      return PostTabularList.__super__.initialize.call(this, {
        columns: [this.dateColumn("date_written"), this.thumbnailColumn(1), this.titleColumn(), this.commentCountColumn(), this.noteCountColumn(), this.statusColumn()],
        filter: {
          type: docType,
          author_id: userId,
          per_page: 5
        }
      });
    };

    return PostTabularList;

  })(btb.DocumentTabularList);

  btb.ProfileDocumentTabularList = (function(_super) {

    __extends(ProfileDocumentTabularList, _super);

    function ProfileDocumentTabularList() {
      ProfileDocumentTabularList.__super__.constructor.apply(this, arguments);
    }

    ProfileDocumentTabularList.prototype.initialize = function(userId) {
      return ProfileDocumentTabularList.__super__.initialize.call(this, {
        columns: [this.dateColumn("date_written"), this.thumbnailColumn(3), this.statusColumn()],
        filter: {
          type: "profile",
          author_id: userId
        }
      });
    };

    return ProfileDocumentTabularList;

  })(btb.DocumentTabularList);

  btb.RequestDocumentTabularList = (function(_super) {

    __extends(RequestDocumentTabularList, _super);

    function RequestDocumentTabularList() {
      RequestDocumentTabularList.__super__.constructor.apply(this, arguments);
    }

    RequestDocumentTabularList.prototype.initialize = function(userId) {
      return RequestDocumentTabularList.__super__.initialize.call(this, {
        columns: [this.dateColumn("date_written"), this.thumbnailColumn(3), this.noteCountColumn(), this.needsAttentionColumn()],
        filter: {
          type: "request",
          author_id: userId
        }
      });
    };

    return RequestDocumentTabularList;

  })(btb.DocumentTabularList);

  btb.LicenseDocumentTabularList = (function(_super) {

    __extends(LicenseDocumentTabularList, _super);

    function LicenseDocumentTabularList() {
      LicenseDocumentTabularList.__super__.constructor.apply(this, arguments);
    }

    LicenseDocumentTabularList.prototype.initialize = function(userId) {
      return LicenseDocumentTabularList.__super__.initialize.call(this, {
        columns: [this.dateColumn("date_written"), this.thumbnailColumn(1)],
        filter: {
          type: "license",
          author_id: userId
        }
      });
    };

    return LicenseDocumentTabularList;

  })(btb.DocumentTabularList);

  btb.PhotoTabularList = (function(_super) {

    __extends(PhotoTabularList, _super);

    function PhotoTabularList() {
      PhotoTabularList.__super__.constructor.apply(this, arguments);
    }

    PhotoTabularList.prototype.initialize = function(userId) {
      return PhotoTabularList.__super__.initialize.call(this, {
        columns: [this.dateColumn("date_written"), this.thumbnailColumn(1), this.statusColumn()],
        filter: {
          type: "photo",
          author_id: userId
        }
      });
    };

    return PhotoTabularList;

  })(btb.DocumentTabularList);

  btb.MissingScanTabularList = (function(_super) {

    __extends(MissingScanTabularList, _super);

    function MissingScanTabularList() {
      MissingScanTabularList.__super__.constructor.apply(this, arguments);
    }

    MissingScanTabularList.prototype.initialize = function(userId) {
      var options,
        _this = this;
      options = {};
      options.collection = new btb.PendingScanList;
      options.collection.filter = {
        author_id: userId,
        missing: true
      };
      options.columns = [
        this.dateColumn("created", "Entered"), this.dateColumn("completed", "Completed"), {
          heading: "Missing",
          render: function(model) {
            return new btb.MissingCheckbox({
              ps: model
            }).render().el;
          }
        }
      ];
      MissingScanTabularList.__super__.initialize.call(this, options);
      return this.collection.fetch({
        success: function() {
          return _this.render();
        }
      });
    };

    return MissingScanTabularList;

  })(btb.TabularList);

  btb.MissingCheckbox = (function(_super) {

    __extends(MissingCheckbox, _super);

    function MissingCheckbox() {
      this.toggle = __bind(this.toggle, this);
      this.render = __bind(this.render, this);
      MissingCheckbox.__super__.constructor.apply(this, arguments);
    }

    MissingCheckbox.prototype.template = _.template($("#missingCheckbox").html());

    MissingCheckbox.prototype.events = {
      'click input': 'toggle'
    };

    MissingCheckbox.prototype.initialize = function(options) {
      return this.ps = options.ps;
    };

    MissingCheckbox.prototype.render = function() {
      $(this.el).html(this.template({
        checked: (this.ps.get("completed") != null) && !(this.ps.get("scan") != null),
        psid: this.ps.get("id")
      }));
      return this;
    };

    MissingCheckbox.prototype.toggle = function(event) {
      var _this = this;
      $(".loading", this.el).show();
      return this.ps.save({
        missing: $(event.currentTarget).is(":checked")
      }, {
        success: function() {
          return $(".loading", _this.el).hide();
        },
        error: function() {
          $(".loading", _this.el).hide();
          return alert("Server error; changes not saved");
        }
      });
    };

    return MissingCheckbox;

  })(Backbone.View);

  btb.UserStatusTable = (function(_super) {

    __extends(UserStatusTable, _super);

    function UserStatusTable() {
      this.render = __bind(this.render, this);
      UserStatusTable.__super__.constructor.apply(this, arguments);
    }

    UserStatusTable.prototype.template = _.template($("#userStatusTable").html());

    UserStatusTable.prototype.initialize = function(options) {
      return this.user = options.user;
    };

    UserStatusTable.prototype.render = function() {
      $(this.el).html(this.template());
      btb.EditInPlace.factory([[this.user, "blogger", $(".blogger", this.el), "checkbox"], [this.user, "managed", $(".managed", this.el), "checkbox"], [this.user, "consent_form_received", $(".consent-form-received", this.el), "checkbox"], [this.user, "is_active", $(".is-active", this.el), "checkbox"]]);
      return this;
    };

    return UserStatusTable;

  })(Backbone.View);

  btb.UserDetail = (function(_super) {

    __extends(UserDetail, _super);

    function UserDetail() {
      this.fetchUser = __bind(this.fetchUser, this);
      this.chooseUser = __bind(this.chooseUser, this);
      this.render = __bind(this.render, this);
      UserDetail.__super__.constructor.apply(this, arguments);
    }

    UserDetail.prototype.template = _.template($("#userManage").html());

    UserDetail.prototype.detailTemplate = _.template($("#userDetail").html());

    UserDetail.prototype.stateTemplate = _.template($("#userState").html());

    UserDetail.prototype.initialize = function(options) {
      if (options.userId) return this.fetchUser(options.userId);
    };

    UserDetail.prototype.render = function() {
      var correspondence, licenses, list, photos, posts, profiles, requests, userChooser, userFields, userId, _i, _len, _ref,
        _this = this;
      $(this.el).html(this.template());
      userChooser = new btb.UserSearch({
        filter: {
          in_org: 1
        }
      });
      userChooser.bind("chosen", function(user) {
        return _this.chooseUser(user);
      });
      $(".user-chooser-holder", this.el).html(userChooser.render().el);
      if (!(this.user != null)) return this;
      userFields = this.user.toJSON();
      $(".user-detail", this.el).html(this.detailTemplate({
        user: userFields
      }));
      btb.EditInPlace.factory([[this.user, "display_name", $(".display-name", this.el)], [this.user, "mailing_address", $(".mailing-address", this.el), "textarea"], [this.user, "special_mail_handling", $(".special-mail-handling", this.el), "textarea"], [this.user, "blog_name", $(".blog-name", this.el)], [this.user, "email", $(".email", this.el)]]);
      $(".user-status-table", this.el).html(new btb.UserStatusTable({
        user: this.user
      }).render().el);
      $(".state", this.el).html(this.stateTemplate({
        user: userFields
      }));
      userId = this.user.get("id");
      licenses = new btb.LicenseDocumentTabularList(userId);
      posts = new btb.PostTabularList(userId);
      requests = new btb.RequestDocumentTabularList(userId);
      profiles = new btb.ProfileDocumentTabularList(userId);
      photos = new btb.PhotoTabularList(userId);
      $(".licenselist", this.el).html(licenses.el);
      $(".postlist", this.el).html(posts.el);
      $(".requestlist", this.el).html(requests.el);
      $(".profilelist", this.el).html(profiles.el);
      $(".photolist", this.el).html(photos.el);
      $(".notelist", this.el).html(new btb.NoteManager({
        filter: {
          user_id: userId
        },
        defaults: {
          user_id: userId
        }
      }).el);
      correspondence = new btb.CorrespondenceManager({
        recipient: this.user
      });
      $(".correspondencelist", this.el).html(correspondence.el);
      _ref = [licenses, posts, requests, profiles, photos];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        list = _ref[_i];
        list.bind("letterAdded", function() {
          return correspondence.table.fetchItems();
        });
      }
      $(".missingscanlist", this.el).html(new btb.MissingScanTabularList(userId).el);
      return this;
    };

    UserDetail.prototype.chooseUser = function(user) {
      btb.app.navigate("#/users/" + (user.get("id")));
      this.user = user;
      return this.render();
    };

    UserDetail.prototype.fetchUser = function(userId) {
      var ul,
        _this = this;
      ul = new btb.UserList;
      return ul.fetchById(userId, {
        success: function(userList, response) {
          var user;
          user = userList.at(0);
          _this.user = userList.at(0);
          return _this.render();
        }
      });
    };

    return UserDetail;

  })(Backbone.View);

}).call(this);
