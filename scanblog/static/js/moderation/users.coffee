class btb.User extends Backbone.Model
    url: "/people/users.json"

class btb.UserList extends btb.FilteredPaginatedCollection
    model: btb.User
    baseUrl: btb.User.prototype.url

class btb.Letter extends Backbone.Model
class btb.LetterList extends btb.FilteredPaginatedCollection
    model: btb.Letter
    baseUrl: "/correspondence/letters.json"

class btb.Organization extends Backbone.Model
class btb.OrganizationList extends btb.FilteredPaginatedCollection
    model: btb.Organization
    url: "/people/organizations.json"

#
# A widget displaying a form for adding a user.  Used by btb.UserSearch as
# well.
#
class btb.UserAdd extends Backbone.View
    template: _.template $("#userAdd").html()
    events:
        'click span.cancel-add-user-link': 'cancel'
        'click input.save-new-user': 'saveNewUser'
    defaults:
        blogger: true
        managed: true
    errors: {}
    initialize: (options) ->
        if options? and options.initial?
            _.extend @defaults, options.initial

    render: =>
        $(@el).html @template
            defaults: @defaults
            errors: @errors
            orgs: btb.ORGANIZATIONS
        this

    saveNewUser: (event) =>
        scope = $(".add-user", @el)
        properties =
            display_name: $("input[name=display_name]", scope).val()
            mailing_address: $("textarea[name=mailing_address]", scope).val()
            blogger: $("input[name=blogger]", scope).is(":checked")
            managed: $("input[name=managed]", scope).is(":checked")
            email: $("input[name=email]", scope).val()
            blog_name: $("input[name=blog_name]", scope).val()
            org_id: $("[name=org_id]", scope).val()
        if not properties.mailing_address
            @errors.mailing_address = "Mailing address required"
        else
            delete @errors.mailing_address
        if properties.blog_name == properties.display_name
            @errors.blog_name = "Blog name should not be the same as the
                writer's name.  Blog names are for unique other names like 'The
                Super Duper Blog'."
        else
            delete @errors.blog_name

        for key, val in @errors
            @defaults = properties
            @render()
            return
        
        ul = new btb.UserList()
        result = ul.create properties, {
            success: (model) =>
                @newUser = model
                @trigger "userAdded", model

            error: (model, response) =>
                alert "Server error"
        }
        result

    cancel: (event) =>
        @trigger "cancelled"

#
# A user chooser widget.  Filters by username, display name, address, and user
# ID.  Initialize with options.filter = {...} to override default filter
# parameters to constrain more.
#
class btb.UserSearch extends btb.PaginatedView
    template: _.template $("#userSearch").html()
    emptyRowTemplate: _.template $("#userSearchResultEmpty").html()
    delay: 100
    defaultFilter:
        per_page: 6
        blogger: true
    events:
        'keyup input.user-chooser-trigger': 'openUserSearch'
        'keyup input.user-search': 'keyUp'
        'click span.pagelink': 'turnPage'
        'click .result': 'chooseResult'
        'click span.add-user-link': 'addUser'
        'click span.cancel-user-search': 'cancel'

    initialize: (options) =>
        filter = if options then options.filter else {}
        @userList = new btb.UserList()
        @userList.filter = _.extend {}, @defaultFilter, filter

    render: =>
        $(@el).html this.template
            term: @userList.filter.q or ""
        this

    keyUp: (event) =>
        switch event.keyCode
            when 40 then @highlightResult(1) # down
            when 38 then @highlightResult(-1) # up
            when 13 then @chooseHighlighted() # enter
            else @fetchItems()
        return false

    highlightResult: (change) =>
        per_page = @userList.filter.per_page
        @highlightedIndex = -1 unless @highlightedIndex?
        @highlightedIndex = Math.max(
            0,
            Math.min(
                @highlightedIndex + change,
                @userList.pagination.count - 1
            )
        )
        # maybe turn page
        too_low = @highlightedIndex < ((@userList.filter.page or 1) - 1) * @userList.filter.per_page
        too_high = @highlightedIndex >= (@userList.filter.page or 1) * @userList.filter.per_page
        if too_low or too_high
            @userList.filter.page = parseInt(@highlightedIndex / @userList.filter.per_page + 1)
            @fetchItems()
        else
            $(".results .result", @el).removeClass("chosen")
            $($(".results .result", @el)[@highlightedIndex % @userList.filter.per_page]).addClass("chosen")

    chooseHighlighted: =>
        $(".results .result.chosen", @el).click()

    openUserSearch: (event, term) =>
        term = term or $(event.currentTarget).val()
        @userList.filter.q = term
        $(".user-chooser-trigger", @el).hide()
        $(".user-chooser", @el).show()
        setTimeout(=>
                $(".user-search", @el).val(term).focus()
                # Chrome selects when we focus, but firefox throws an
                # exception when setting selectionStart and SelectionEnd
                try
                    $(".user-search", @el).prop
                        selectionStart: term.length
                        selectionEnd: term.length
                catch error
            , 0)

    closeUserSearch: =>
        @userList.filter.q = ""
        $(".user-chooser-trigger", @el).val("").show()
        $(".user-chooser", @el).hide()

    renderItems: =>
        $(".results .result, .results .noresult", @el).remove()
        if (@userList.length > 0)
            # Highlight search terms
            @userList.each (user, i) =>
                compact = new btb.UserCompact {user: user, term: @userList.filter.q}
                el = compact.render().el
                $(el).addClass("result")
                $(".results", @el).append el
        else
            $(".results", @el).append(@emptyRowTemplate())
        @renderPagination(@userList, $(".pagination", @el))

    fetchItems: =>
        @userList.filter.q = $(".user-search", @el).val().substring(0, 20)
        if @_timeout?
            window.clearTimeout @_timeout
        delayed = =>
            $(".user-search", @el).addClass "loading"
            @userList.fetch
                success: =>
                    @renderItems()
                    $(".user-search", @el).removeClass "loading"
                    @highlightResult(0) if @highlightedIndex? or @userList.length == 1
                    @trigger "searchDone", @userList
                error: => alert "Sever error"
        @_timeout = window.setTimeout delayed, @delay

    turnPage: (event) =>
        @userList.filter.page = @newPageFromEvent event
        @fetchItems()

    chooseResult: (event) =>
        userId = parseInt $.trim $("input.user-id-raw", event.currentTarget).val()
        chosen = @userList.get parseInt(userId)
        @closeUserSearch()
        @trigger "chosen", chosen
    
    addUser: (event) =>
        initialName = $(".user-search", @el).val()
        initialName = _.map(initialName.split(/\s+/,), (word) ->
            word.substr(0, 1).toUpperCase() + word.substr(1).toLowerCase()
        ).join(" ")

        @userAdd = new btb.UserAdd { initial: { display_name: initialName } }
        @userAdd.bind "userAdded", (user) =>
            @trigger "chosen", user
            @userAdd.unbind()
        @userAdd.bind "cancelled", =>
            @userList.filter.q = initialName or ""
            @render()
            @userAdd.unbind()
        $(@el).html @userAdd.render().el

    cancel: (event) =>
        @closeUserSearch()
        @trigger "cancelled"

#
# User chooser which toggles state to become text instead of an input when a
# user is chosen, but can be clicked to turn back into a chooser.
#
class btb.InPlaceUserChooser extends Backbone.View
    template: _.template $("#inPlaceUserChooser").html()
    events:
        "click .user-name": "unchoose"

    initialize: (user) ->
        @user = user
        @userChooser = new btb.UserSearch
        @userChooser.bind "chosen", (model) =>
            @choose model
            @trigger "chosen", (model)
        @userChooser.bind "cancelled", =>
            if @user?
                @choose(@user)
        $(@el).addClass "in-place-user-toggle"

    render: =>
        $(@el).html @template()
        $(@el).addClass "in-place-user-chooser"
        $(".user-chooser-holder", @el).html @userChooser.render().el
        if @user?
            @choose @user
        this

    choose: (user) =>
        @user = user
        $(".user-name", @el).show().html _.escapeHTML user.get "display_name"
        $(".user-name", @el).attr("data-user-id", user.id)
        $(".user-chooser-holder", @el).hide()

    setUser: (user) =>
        @choose(user)
        @trigger "chosen", user


    unchoose: =>
        if @user?
            @userChooser.openUserSearch(null, @user.get "display_name")
        $(".user-chooser-holder", @el).show()
        $(".user-name", @el).hide()


#
# A compact representation of the basic information about a user, usable for
# user chooser widgets, or other situations where you need something fairly
# compact but expressive.
#
class btb.UserCompact extends Backbone.View
    template: _.template $("#compactUser").html()
    stateTemplate: _.template $("#userState").html()
    initialize: (options) ->
        @user = options.user
        @term = options.term

    render: =>
        fields = @user.toJSON()
        fields.id_raw = fields.id
        if @term
            terms = [t for t in @term.split(/\s+/) when t isnt ""].join("|")
            if terms.length > 0
                for field in ["display_name", "mailing_address", "id"]
                    fields[field] = _.escapeHTML(fields[field] + '').replace(
                        new RegExp("(" + terms + ")", "gi"),
                        "<span class='highlight'>$1</span>"
                    )
        $(@el).html @template {user: fields}
        $(".state", @el).html @stateTemplate {user: fields}
        this

#
# Base class for scanning.models.Document-based tabular lists.  Initialize with:
#  options
#    filter: { hash of filter params }
#    columns: list of hashes which contain { heading: ..., render: (obj) -> ... }
#
class btb.DocumentTabularList extends btb.TabularList
    thumbnailTemplate: _.template $("#userDetailDocumentThumbnails").html()
    initialize: (options) ->
        options.collection = new btb.DocumentList
        options.collection.filter = options.filter
        super options
        @collection.fetch
            success: => @render()
    thumbnailColumn: (count) =>
        template = @thumbnailTemplate
        return {
            heading: "Thumbnail"
            render: (obj) ->
                all_pages = obj.get 'pages' or []
                pages = all_pages[0...Math.min(count, all_pages.length)]
                template
                    pages: pages
                    show_url: obj.get "url"
                    edit_url: obj.get "edit_url"
        }
    titleColumn: ->
        heading: "Title"
        render: (obj) -> new btb.EditInPlace({
                model: obj
                field: "title"
            }).render().el
    statusColumn: =>
        heading: "Status"
        render: (obj) =>
            el = new btb.UserDetailDocumentStatusControl(obj)
            el.bind "letterAdded", => @trigger "letterAdded"
            el.render().el
    commentCountColumn: ->
        heading: "Replies"
        render: (obj) -> "<a href='#{_.escapeHTML obj.get "url"}#comments'>#{obj.get "comment_count" }</a>"
    noteCountColumn: ->
        heading: "Notes"
        render: (obj) -> "<a href='#{_.escapeHTML obj.get "edit_url"}'>#{ obj.get "notes_count" }</a>"
    needsAttentionColumn: ->
        heading: "Needs attention?"
        render: (obj) ->
            div = $("<div/>")
            a = $("<a href=#/process/document/#{obj.id}/>")
            div.append(a)
            collection = new btb.NoteList
            collection.filter = {document_id: obj.id, unresolved: 1}
            collection.fetch
                success: ->
                    if collection.length > 0
                        a.append("Needs attention")
                        div.css("background-color", "#fee")
                        div.after("<p>#{_.escapeHTML collection.at(0).get "text" }</p>")
                    else
                        a.append("All good")
                        div.css("background-color", "#efe")
            return div


class btb.UserDetailDocumentStatusControl extends Backbone.View
    template: _.template $("#userDetailDocumentStatus").html()
    events:
        "change .status": "updateStatus"
        "change .adult": "updateAdult"
        "click .queue-printout": "queuePrintout"
    initialize: (doc) ->
        @doc = doc
    render: =>
        $(@el).html @template adult: @doc.get("adult")
        $(".status", @el).val _.escapeHTML @doc.get("status")
        this
    updateStatus: (event) =>
        @showLoading()
        @doc.save({status: $(event.currentTarget).val()}, {
            success: => @hideLoading()
            error: => @showError()
        })
    updateAdult: (event) =>
        @showLoading()
        @doc.save({adult: $(event.currentTarget).is(":checked")}, {
            success: => @hideLoading()
            error: => @showError()
        })
    queuePrintout: =>
        @showLoading()
        letter = new btb.Letter
        letter.save {
            type: "printout"
            recipient_id: @doc.get("author").id
            document_id: @doc.id
        }, {
            success: =>
                @hideLoading()
                @trigger("letterAdded")
            error: =>
                alert("Server error.  Letter not saved.")
                @hideLoading()
        }
            
    showLoading: => $(".loading", @el).show()
    hideLoading: => $(".loading", @el).hide()
    showError: =>
        $(".loading", @el).hide()
        $(".error", @el).show()

#
# A table of posts by a particular user.
#
class btb.PostTabularList extends btb.DocumentTabularList
    initialize: (userId, docType="post") ->
        super
            columns: [
                    @dateColumn("date_written")
                    @thumbnailColumn(1)
                    @titleColumn()
                    @commentCountColumn()
                    @noteCountColumn()
                    @statusColumn()
                ]
            filter: {type: docType, author_id: userId, per_page: 5}


#
# A table of profiles by a particular user.
#
class btb.ProfileDocumentTabularList extends btb.DocumentTabularList
    initialize: (userId) ->
        super
            columns: [
                @dateColumn("date_written")
                @thumbnailColumn(3)
                @statusColumn()
            ]
            filter: {type: "profile", author_id: userId}

class btb.RequestDocumentTabularList extends btb.DocumentTabularList
    initialize: (userId) ->
        super
            columns: [
                @dateColumn("date_written")
                @thumbnailColumn(3)
                @noteCountColumn()
                @needsAttentionColumn()
            ]
            filter: {type: "request", author_id: userId}

class btb.LicenseDocumentTabularList extends btb.DocumentTabularList
    initialize: (userId) ->
        super
            columns: [
                @dateColumn("date_written")
                @thumbnailColumn(1)
            ]
            filter: {type: "license", author_id: userId}

#
# A table of photos by a particular user.
#
class btb.PhotoTabularList extends btb.DocumentTabularList
    initialize: (userId) ->
        super
            columns: [
                    @dateColumn("date_written"), @thumbnailColumn(1)
                    @statusColumn()
                ]
            filter: {type: "photo", author_id: userId}

#
# A table of missing scans by a particular user.
#
class btb.MissingScanTabularList extends btb.TabularList
    initialize: (userId) ->
        options = {}
        options.collection = new btb.PendingScanList
        options.collection.filter = { author_id: userId, missing: true }
        options.columns = [
            @dateColumn("created", "Entered"), @dateColumn("completed", "Completed"), {
                heading: "Missing"
                render: (model) -> new btb.MissingCheckbox(ps: model).render().el
            }
        ]
        super options
        @collection.fetch
            success: => @render()

class btb.MissingCheckbox extends Backbone.View
    template: _.template $("#missingCheckbox").html()
    events:
        'click input': 'toggle'

    initialize: (options) ->
        @ps = options.ps

    render: =>
        $(@el).html @template {
            checked: @ps.get("completed")? and not @ps.get("scan")?
            psid: @ps.get("id")
        }
        this

    toggle: (event) =>
        $(".loading", @el).show()
        @ps.save {missing: $(event.currentTarget).is(":checked")}, {
            success: =>
                $(".loading", @el).hide()
            error: =>
                $(".loading", @el).hide()
                alert("Server error; changes not saved")
        }
        
class btb.UserStatusTable extends Backbone.View
    template: _.template $("#userStatusTable").html()

    initialize: (options) ->
        @user = options.user

    render: =>
        $(@el).html @template()
        btb.EditInPlace.factory [
            [@user, "blogger", $(".blogger", @el), "checkbox"]
            [@user, "managed", $(".managed", @el), "checkbox"]
            [@user, "consent_form_received", $(".consent-form-received", @el), "checkbox"]
            [@user, "is_active", $(".is-active", @el), "checkbox"]
        ]
        this
    

#
# Ye grande olde User Detail Page view
#
class btb.UserDetail extends Backbone.View
    template: _.template $("#userManage").html()
    detailTemplate: _.template $("#userDetail").html()
    stateTemplate: _.template $("#userState").html()

    initialize: (options) ->
        @fetchUser(options.userId) if options.userId

    render: =>
        $(@el).html @template()
        userChooser = new btb.UserSearch(filter: {in_org: 1})
        userChooser.bind "chosen", (user) => @chooseUser(user)
        $(".user-chooser-holder", @el).html userChooser.render().el
        if not @user?
            return this

        userFields = @user.toJSON()
        $(".user-detail", @el).html @detailTemplate
            user: userFields
        btb.EditInPlace.factory [
            [@user, "display_name", $(".display-name", @el)]
            [@user, "mailing_address", $(".mailing-address", @el), "textarea"]
            [@user, "special_mail_handling", $(".special-mail-handling", @el), "textarea"]
            [@user, "blog_name", $(".blog-name", @el)]
            [@user, "email", $(".email", @el)]
        ]
        $(".user-status-table", @el).html(
            new btb.UserStatusTable(user: @user).render().el
        )
        $(".state", @el).html @stateTemplate {user: userFields}

        userId = @user.get "id"
        licenses = new btb.LicenseDocumentTabularList(userId)
        posts = new btb.PostTabularList(userId)
        requests = new btb.RequestDocumentTabularList(userId)
        profiles = new btb.ProfileDocumentTabularList(userId)
        photos = new btb.PhotoTabularList(userId)

        $(".licenselist", @el).html licenses.el
        $(".postlist", @el).html posts.el
        $(".requestlist", @el).html requests.el
        $(".profilelist", @el).html profiles.el
        $(".photolist", @el).html photos.el

        $(".notelist", @el).html new btb.NoteManager({
            filter: {user_id: userId}
            defaults: {user_id: userId}
        }).el

        correspondence = new btb.CorrespondenceManager({
            recipient: @user
        })
        $(".correspondencelist", @el).html correspondence.el

        for list in [licenses, posts, requests, profiles, photos]
            list.bind "letterAdded", => correspondence.table.fetchItems()

        $(".missingscanlist", @el).html new btb.MissingScanTabularList(userId).el
        this

    chooseUser: (user) =>
        btb.app.navigate "#/users/#{user.get "id"}"
        @user = user
        @render()

    fetchUser: (userId) =>
        ul = new btb.UserList
        ul.fetchById userId, {
            success: (userList, response) =>
                user = userList.at 0
                @user = userList.at 0
                @render()
        }

