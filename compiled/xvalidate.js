'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var XValidate = window.XValidate || {};

// classes
(function ($, X) {
    var utils = {
        // Gets or sets data associated with the element. Gets data if value is undefined, else sets data.
        data: function data($element, key, value) {
            if (value === undefined) {
                return $element.data(key);
            }
            $element.data(key, value);
        }
    };

    var constants = {
        attr: {
            plugins: 'xval', // An element within a form (see below) to be validated. Required. Set to a comma separated list of plugin names.
            // Evaluated in order. Wrap in square brackets to hide message if predecessors fail.
            // Set plugin context in data-xval-{pluginname}. { message: '', url: '', data: { ''somekey'': {0}' } }
            form: 'xval-form', // A form to be validated. Required. Form elements will be validated on submit. Other elements will be validated on a descendant button click.
            message: 'xval-message-for' // The message displaying the validation message. Optional. Set to the name or id of the element.
        },
        classes: { // CSS classes added by the validator. Can be used for styling
            messageValid: 'field-validation-valid',
            messageInvalid: 'field-validation-invalid field-validation-error',
            validating: 'x-validating'
        },
        data: { // The data-* attributes used privately
            invalidCount: '_xval-invalidCount',
            validating: '_xval-validating',
            valid: '_xval-valid'
        },
        events: { // The events triggered during validation.
            validating: 'xval.validating', // Triggered on the form when validation starts.
            validated: 'xval.validated' // Triggered on the form when validation ends.
        }
    };

    var plugins = {};

    $.extend(X, {
        Form: function Form($form) {
            var self = this;

            return {
                errorLabelFor: function errorLabelFor(target) {
                    return $('[data-' + constants.attr.message + '="' + target.name + '"]', $form);
                },
                hideErrors: function hideErrors(target) {
                    self.errorLabelFor(target).html('').removeClass(constants.classes.messageInvalid).addClass(constants.classes.messageValid);
                },
                invalidCount: function invalidCount(value) {
                    return utils.data($form, constants.data.invalidCount, value);
                },
                onValidateRequired: function onValidateRequired(callback) {
                    if ($form.is('form')) {
                        $form.on('submit', function (e) {
                            callback(e);
                            return false;
                        });
                        return;
                    }
                    $('button', $form).on('click', callback);
                    return;
                },
                showError: function showError(target) {
                    self.errorLabelFor(target).html(self.errorLabelFor(target).html() + 'error message ').removeClass(constants.classes.messageValid).addClass(constants.classes.messageInvalid);
                },
                targets: function targets() {
                    var $elements = $('[data-' + constants.attr.plugins + ']', $form);
                    return $.map($elements, function (element) {
                        return new X.Target(self, $(element));
                    });
                },
                trigger: function trigger(name) {
                    $form.trigger(name);
                },
                validating: function validating(value) {
                    return utils.data($form, constants.data.validating, value);
                }
            };
        },
        Plugin: function Plugin(name, callback) {
            return {
                get name() {
                    return name;
                },
                validate: function validate(result) {
                    return callback(result) === true;
                }
            };
        },
        PluginContext: function PluginContext($element, pluginName) {
            var self = this;

            var context = JSON.parse(utils.data($element, constants.attr.plugins + '-' + pluginName));

            var dataTemplate = context.data;
            if (dataTemplate) {
                context.dataTemplate = JSON.stringify(dataTemplate);
            } else {
                context.dataTemplate = '{ "' + ($element[0].name || $element[0].id) + '":"{0}"}';
            }

            return {
                data: function data() {
                    // todo: string interpolation model binding style?
                    return JSON.parse(self.dataTemplate.replace('{0}', $element.val()));
                },
                get dataTemplate() {
                    return context.dataTemplate;
                },
                get message() {
                    return context.message;
                },
                get pluginName() {
                    return pluginName;
                },
                get url() {
                    return context.url;
                }
            };
        },
        Plugins: {
            add: function add(name, callback) {
                if (!name || typeof callback !== 'function') {
                    return;
                }

                // only allow alpha-numeric, underscore and hyphens in plugin names
                if (/[^\w|\-]+/.test(name)) {
                    console.log('invalid plugin name \'' + name + '\'');
                }

                if (plugins.hasOwnProperty(name)) {
                    console.log('plugin \'' + name + '\' has already been added');
                    return;
                }

                plugins[name] = callback;
            },
            all: function all() {
                return plugins;
            },
            get: function get(name) {
                return plugins[name];
            }
        },
        Target: function Target(form, $element) {
            var self = this;

            var pluginNames = utils.data($element, constants.attr.plugins).split(',');
            var pluginContexts = $.map(pluginNames, function (pluginName) {
                return new X.PluginContext($element, pluginName);
            });

            function getPluginContext(pluginName) {
                return pluginContexts[pluginName];
            }

            function createRequest(pluginName) {
                var context = getPluginContext(pluginName);
                return $.ajax({
                    url: target.url,
                    data: target.data()
                });
            }

            return {
                createRequests: function createRequests() {
                    return $.map(pluginNames, function (pluginName) {
                        return createRequest;
                    });
                },
                get name() {
                    return $element[0].name;
                },
                valid: function valid(value) {
                    if (value === false) {
                        form.invalidCount(form.invalidCount() + 1);
                        form.showError(self);
                    }
                    return utils.data($element, constants.data.valid, value);
                }
            };
        },
        Validator: function Validator(form) {
            // private functions
            var start = function start() {
                form.trigger(constants.events.validating);
                form.validating(true);
                form.invalidCount(0);
            };

            var stop = function stop() {
                form.validating(false);
                form.trigger(constants.events.validated);
            };

            var createRequests = function createRequests(targets) {
                var requests = [];
                // todo: review this loop within a loop
                for (var t = 0; t < targets.length; t++) {
                    requests.push.apply(requests, _toConsumableArray(targets(t).createRequests()));
                }

                return requests;
            };

            var onFulfilled = function onFulfilled(targets, results) {
                for (var i = 0; i < results.length; i++) {
                    var _target = targets[i];
                    // todo: handle multiple vals per target
                    form.hideErrors(_target);
                    // todo: review this line. Presumably results are just the array of ajax results
                    var result = results.length === 1 ? results[0] : results[i][0];
                    // todo: configure result eval. ***Plugin***
                    var isValid = result === true;
                    _target.valid(isValid);
                }
            };

            var onRejected = function onRejected() {};

            return {
                validate: function validate() {
                    if (form.validating() === true) {
                        return;
                    }

                    start();

                    var targets = form.targets();
                    var requests = createRequests(targets);

                    Promise.all(requests).then(function (results) {
                        return onFulfilled(targets, results);
                    }, onRejected).then(stop);
                }
            };
        }
    });

    return X;
})(jQuery, XValidate);

// jQuery plugin
(function ($, X) {
    $.fn.xvalidate = function (options) {
        var _this = this;

        return this.each(function () {
            var form = new X.Form($(_this));
            var validator = new X.Validator(form);
            form.onValidateRequired(validator.validate);
        });
    };
})(jQuery, XValidate);

// invoke
$(function () {
    /*default implementation*/
    var forms = $('[data-xval-form]').xvalidate();
    console.log(forms);
});