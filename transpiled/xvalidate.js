'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var XValidate = window.XValidate || {};

(function ($, X) {
    var utils = {
        // adds or removes the class from the element based on the set value.
        setClass: function setClass($element, className, set) {
            return set === true ? $element.addClass(className) : $element.removeClass(className);
        }
    };

    // private constants. A copy of these is exposed publicly. A copy of the classes is taken (and can be overridden when creating a new Form).
    var constants = {
        attr: {
            // A form to be validated. Required. Form elements will be validated on submit. Other elements will be validated on a descendant button click.
            form: 'data-xval-form',
            // The plugins an element within a form requires to be validated. Required. Set to a comma separated list of plugin names.
            // Add an accompanying plugin via XValidate.Plugins.add(options).
            plugins: 'data-xval-plugins',
            // The message displaying the validation message. Optional. Set attribute value to the name of the element.
            // Use ${0} as a placeholder for the value
            message: 'data-xval-message-for',
            // The element whose click event triggers a form validation. Optional. Not required if validating a form element or a non-form element with a button
            submit: 'data-xval-submit'
        },
        // CSS classes added by the validator for styling. Can be overridden by setting options.classes on setup.
        classes: {
            // todo: match bootstrap conventions?
            message: 'validation-message',
            messageInvalid: 'validation-message--invalid',
            target: 'validation-target',
            targetInvalid: 'validation-target--invalid',
            // added to the target and message
            validating: 'validating'
        },
        // The events triggered during validation.
        events: {
            // Triggered on the form when validation starts.
            validating: 'xval.validating',
            // Triggered on the form when validation ends. Returns event args with params: valid
            validated: 'xval.validated'
        }
    };

    // Store all registered plugins
    var plugins = {};

    /** Methods to add and remove validation plugins. */
    var Plugins = {
        /** Add a new plugin */
        add: function add(options) {
            /* validate options */
            if (!options.name || !options.url) {
                console.log('plugin name or url not specified');
                return;
            }

            // check validateResponse is a function
            if (options.validateResponse && typeof options.validateResponse !== 'function') {
                console.log('validateResponse is not a function');
                return;
            }

            // check getData is a function
            if (options.getData && typeof options.getData !== 'function') {
                console.log('getData is not a function');
                return;
            }

            // only allow alpha-numeric, underscore and hyphens in plugin names
            if (/[^\w|\-]+/.test(options.name)) {
                console.log('invalid plugin name \'' + options.name + '\'');
                return;
            }

            // enforce unique plugin names
            if (plugins.hasOwnProperty(options.name)) {
                console.log('plugin \'' + options.name + '\' has already been added');
                return;
            }

            plugins[options.name] = new Plugin(options);
        },
        /** Add an array of plugins */
        addRange: function addRange(items) {
            $.each(items, function (key) {
                Plugins.add(items[key]);
            });
        },
        /** Get the plugin with the given name */
        get: function get(name) {
            return plugins[name];
        }
    };

    /** Wrapper for a DOM element containing elements to be validated.  */

    var Form = function () {
        function Form($form, options) {
            _classCallCheck(this, Form);

            var self = this;

            // set classes. this is required by the Target constructor
            this.classes = $.extend({}, constants.classes, options ? options.classes : null);

            /* set up targets and validations */
            var targets = [];
            var validations = [];

            // todo: handle dynamic forms
            // todo: optimise this double selector
            var $nestedTargets = $('[' + constants.attr.form + '] [' + constants.attr.plugins + ']', $form);
            var $targets = $('[' + constants.attr.plugins + ']', $form).not($nestedTargets);
            $targets.each(function () {
                var target = new Target(self, $(this));
                if (target.validations.length > 0) {
                    targets.push(target);
                    validations.push.apply(validations, _toConsumableArray(target.validations));
                }
            });

            /* set up messages */
            var messages = {};
            $('[' + constants.attr.message + ']', $form).each(function () {
                var message = $(this);
                message.addClass(self.classes.message);
                var targetName = message.attr(constants.attr.message);
                messages[targetName] = message;
            });

            this.$form = $form;
            this.messages = messages;
            this.targets = targets;
            this.valid = false;
            this.validating = false;
            this.validations = validations;
        }

        _createClass(Form, [{
            key: 'clearMessages',
            value: function clearMessages() {
                var _this = this;

                $.each(this.messages, function (key, message) {
                    return message.html('').removeClass(_this.classes.messageInvalid);
                });
            }
        }, {
            key: 'messageFor',
            value: function messageFor(target) {
                return this.messages[target.name];
            }
        }, {
            key: 'onValidateRequired',
            value: function onValidateRequired(callback) {
                var validate = function validate(e) {
                    callback(e);
                    // cancel the submit for now
                    // todo: continue form submit without validating?
                    return false;
                };

                if (this.$form.is('form')) {
                    this.$form.on('submit', function (e) {
                        return validate(e);
                    });
                } else {
                    // bind all child button clicks to the validate action
                    $('button,[' + constants.attr.submit + ']', this.$form).on('click', function (e) {
                        return validate(e);
                    });
                }
            }
        }, {
            key: 'onValidateStart',
            value: function onValidateStart() {
                this.trigger(constants.events.validating);
                this.validating = true;
                this.setChildrenValidating(true);
                this.clearMessages();
                this.valid = true;
            }
        }, {
            key: 'onValidateStop',
            value: function onValidateStop() {
                this.validating = false;
                this.setChildrenValidating(false);
                this.trigger(constants.events.validated, {
                    valid: this.valid === true
                });
            }
        }, {
            key: 'setChildrenValidating',
            value: function setChildrenValidating(value) {
                var _this2 = this;

                // update target validating values
                $.each(this.targets, function (i, target) {
                    target.validating = value;
                    return true; // to stay in loop
                });

                // add or remove validating css class on messages
                $.each(this.messages, function (key, message) {
                    return utils.setClass(message, _this2.classes.validating, value);
                });
            }
        }, {
            key: 'trigger',
            value: function trigger(eventType, e) {
                // todo: pass through original event args (submit/click)?
                this.$form.trigger(eventType, e);
            }
        }]);

        return Form;
    }();

    /** A validation plugin. Used to define request and response options. */


    var Plugin = function () {
        function Plugin(options) {
            _classCallCheck(this, Plugin);

            var defaults = {
                message: 'invalid',
                getData: function getData(target) {
                    return _defineProperty({}, '' + target.name, '\'' + target.value + '\'');
                },
                validateResponse: function validateResponse(response) {
                    return response === true;
                }
            };

            options = $.extend({}, defaults, options);

            this.ajaxOptions = options.ajaxOptions;
            this.message = options.message;
            this.name = options.name;
            this.getData = options.getData;
            this.validateResponse = options.validateResponse;
            this.url = options.url;
        }

        _createClass(Plugin, [{
            key: 'isValid',
            value: function isValid(response) {
                return this.validateResponse(response) === true;
            }
        }]);

        return Plugin;
    }();

    /** Wrapper for a DOM element that is to be validated */


    var Target = function () {
        function Target(form, $element) {
            var _this3 = this;

            _classCallCheck(this, Target);

            $element.addClass(form.classes.target);

            /* set up validations */
            var validations = [];

            var pluginNames = $element.attr(constants.attr.plugins).split(',');
            $.each(pluginNames, function (i, pluginName) {
                if (pluginName) {
                    var plugin = Plugins.get(pluginName);
                    if (plugin) {
                        validations.push(new Validation(_this3, plugin));
                    } else {
                        console.log('plugin ' + pluginName + ' not found');
                    }
                }
            });

            this.$element = $element;
            this.form = form;
            this.name = $element[0].name;
            this.validations = validations;
        }

        _createClass(Target, [{
            key: 'showError',
            value: function showError(messageText) {
                this.$element.addClass(this.form.classes.targetInvalid);
                var message = this.form.messageFor(this);
                message.html(message.html() + messageText + ' ').addClass(this.form.classes.messageInvalid);
            }
        }, {
            key: 'validating',
            set: function set(value) {
                if (value === true) {
                    this.$element.removeClass(this.form.classes.targetInvalid);
                }
                utils.setClass(this.$element, this.form.classes.validating, value);
            }
        }, {
            key: 'value',
            get: function get() {
                return this.$element.val();
            }
        }]);

        return Target;
    }();

    /** Validation for an instance of a plugin on a target */


    var Validation = function () {
        function Validation(target, plugin) {
            _classCallCheck(this, Validation);

            this.plugin = plugin;
            this.target = target;
        }

        _createClass(Validation, [{
            key: 'createRequest',
            value: function createRequest() {
                return $.ajax($.extend({}, this.plugin.ajaxOptions, {
                    url: this.plugin.url,
                    data: this.plugin.getData(this.target)
                }));
            }
        }, {
            key: 'message',
            value: function message() {
                // todo: better templating
                return this.plugin.message.replace('${0}', this.target.value);
            }
        }, {
            key: 'validate',
            value: function validate(response) {
                var isValid = this.plugin.isValid(response);
                if (isValid === false) {
                    this.target.form.valid = false;
                    this.target.showError(this.message());
                }
            }
        }]);

        return Validation;
    }();

    /** Validator for a form. Orchestrates the requests and responses. */


    var Validator = function () {
        function Validator($form, options) {
            var _this4 = this;

            _classCallCheck(this, Validator);

            var form = new Form($form, options);
            form.onValidateRequired(function () {
                return _this4.validate();
            });

            this.form = form;
        }

        _createClass(Validator, [{
            key: 'onFail',
            value: function onFail(reason) {
                console.log('an error has occurred:');
                console.log(reason);
            }
        }, {
            key: 'onFulfilled',
            value: function onFulfilled(responses) {
                var _this5 = this;

                $.each(responses, function (i, response) {
                    return _this5.form.validations[i].validate(response);
                });
            }
        }, {
            key: 'validate',
            value: function validate() {
                var _this6 = this;

                if (this.form.validating === true) {
                    return;
                }

                this.form.onValidateStart();

                var requests = $.map(this.form.validations, function (validation) {
                    return validation.createRequest();
                });

                Promise.all(requests).then(function (responses) {
                    return _this6.onFulfilled(responses);
                }, this.onFail).catch(this.onFail).then(function () {
                    return _this6.form.onValidateStop();
                });
            }
        }]);

        return Validator;
    }();

    // jQuery plugin


    var validators = [];
    $.fn.xvalidate = function (options) {
        return this.each(function (i, form) {
            return validators.push(new Validator($(form), options));
        });
    };

    // expose public objects
    $.extend(X, {
        // take a copy of the constants
        Constants: $.extend(true, {}, constants),
        Plugins: Plugins
    });

    return X;
})(jQuery, XValidate);

// invoke default implementation
$(function () {
    $('[data-xval-form]').xvalidate();
});