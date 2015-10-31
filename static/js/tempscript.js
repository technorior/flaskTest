window.addEvent('domready', function() {
        {   // See http://stackoverflow.com/questions/10590420/ace-editor-uncaught-typeerror-cannot-read-property-clientx-of-undefined
            // for detailed bug explaination (mootools/ace api collision).
            delete Function.prototype.bind;
            Function.implement({
                /*<!ES5-bind>*/
                bind: function(that){
                    var self = this,
                        args = arguments.length > 1 ? Array.slice(arguments, 1) : null,
                        F = function(){};
                    var bound = function(){
                        var context = that, length = arguments.length;
                        if (this instanceof bound){
                            F.prototype = self.prototype;
                            context = new F;
                        }
                        var result = (!args && !length)
                            ? self.call(context)
                            : self.apply(context, args && length ? args.concat(Array.slice(arguments)) : args || arguments);
                        return context == that ? result : context;
                    };
                    return bound;
                },
                /*</!ES5-bind>*/
            });
        }
        var editor = ace.edit("editor");
        //editor.setTheme("{{ url_for('static', filename='lib/contrib/src-min-noconflict/monkai') }}");
        var CppMode = ace.require("ace/mode/c_cpp").Mode;
        editor.getSession().setMode(new CppMode());
        editor.$blockScrolling = Infinity;
        editor.setOptions({
            maxLines: 20,
            readOnly: true  // will be unset, when AJAX fetching request is done.
        });
        // TODO: XXX
        editor.getSession().setValue("// loading content, please wait...");
        var fetchingRequest = new Request.JSON({
                url: $SCRIPT_ROOT+"/target_content_exchange",
                method : 'GET',
                urlEncoded : false,
                //buttonChecked: $('exampleSelect-1').checked,
                onRequest : function() {
                    editor.setReadOnly(true);
                    $('submitButton').addClass('disabled');
                    $('retrieveButton').addClass('disabled');
                },
                onComplete : function(rqd) {
                    if( rqd &&
                        rqd.hasOwnProperty('content') &&
                        rqd.exists /*&&
                        rqd.hasOwnProperty('digest')*/ ) {
                        editor.getSession().setValue(rqd.content);
                        editor.setReadOnly(false);
                    } else {
                        editor.getSession().setValue('// File IO error on server side.');
                        editor.setReadOnly(true);
                        // TODO: detailed error description can be provided here this way:
                        $('errorsList').grab( new Element('li', {'text' : 'Got an IO server error.'}) );
                    }
                    $('submitButton').removeClass('disabled');
                    $('retrieveButton').removeClass('disabled');
                },
                headers : { "X-CSRFToken": $CSRF_TOKEN,
                            'Content-type' : 'application/json',
                         },
            }),
            commitingRequest = new Request.JSON({
                url: $SCRIPT_ROOT+"/target_content_exchange",
                //data :,
                method : 'POST',
                urlEncoded : false,
                onRequest : function() {
                    editor.setReadOnly(true);
                    $('submitButton').addClass('disabled');
                    $('retrieveButton').addClass('disabled');
                },
                onComplete : function(rqd) {
                    if( rqd &&
                        rqd.hasOwnProperty('result') &&
                        rqd.result == 'updated' /*&&
                        rqd.hasOwnProperty('digest')*/ ) {
                        editor.setReadOnly(false);
                        $('submitButton').removeClass('disabled');
                    } else {
                        // TODO: detailed error description can be provided here this way:
                        $('errorsList').grab( new Element('li', {'text' : 'Got a server error.'}) );
                    }
                },
                headers : { "X-CSRFToken": $CSRF_TOKEN,
                            'Content-type' : 'application/json',
                         },
            });
        fetchingRequest.send('radio=lcd');
        $('submitButton').addEvent('click', function(e){
                e.stop();
                commitingRequest.data
                commitingRequest.post(JSON.encode({'content' : editor.getSession().getValue()}));
            } );
        $('retrieveButton').addEvent('click', function(e){
                e.stop();
                fetchingRequest.send('radio='+$$('select[name=exSel2]').getSelected()[0].get('value')[0]);
            } );
    });