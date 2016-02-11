'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var XValidate = window.XValidate || {};

XValidate.Constants = function () {
    function Constants() {
        _classCallCheck(this, Constants);
    }

    _createClass(Constants, null, [{
        key: 'attr',
        get: function get() {
            // The data-* attributes to set in the markup.
            return {
                data: 'xval-data', // The data to pass to the request. Optional. Key names must be quoted for JSON.parse. Fallback to an object like: { elementname: elementvalue }.
                element: 'xval', // An element within a form (see below) to be validated. Required.
                form: 'xval-form', // A form to be validated. Required. Will be validated on submit if a form, else by a button click if anything else.
                url: 'xval-url', // The url for the request. Required.
                message: 'xval-message-for' // The message displaying the validation message. Optional. Set to the name or id of the element.
            };
        }
    }, {
        key: 'classes',
        get: function get() {
            // CSS classes added by the validator. Can be used for styling. Can be overwritten.
            return {
                messageValid: 'field-validation-valid',
                messageInvalid: 'field-validation-invalid field-validation-error',
                validating: 'x-validating'
            };
        }
    }, {
        key: 'dataAttr',
        get: function get() {
            // The data-* attributes used to store status
            return {
                invalidCount: '_xval-invalidCount',
                validating: '_xval-validating',
                valid: '_xval-valid'
            };
        }
    }, {
        key: 'events',
        get: function get() {
            // The events triggered during validation.
            return {
                validating: 'xval.validating', // Triggered on the form when validation starts.
                validated: 'xval.validated' // Triggered on the form when validation ends.
            };
        }
    }]);

    return Constants;
}();

XValidate.Utils = function () {
    function Utils() {
        _classCallCheck(this, Utils);
    }

    _createClass(Utils, null, [{
        key: 'data',

        // todo replace calls to $.data with Utils.data
        value: function data($element, attr, value) {
            if (value === undefined) {
                return $element.data(attr);
            }
            $element.data(attr, value);
        }
    }]);

    return Utils;
}();

XValidate.Form = function () {
    function Form($form) {
        _classCallCheck(this, Form);

        this.$form = $form;
    }

    _createClass(Form, [{
        key: 'errorLabelFor',
        value: function errorLabelFor(target) {
            return $('[data-' + XValidate.Constants.attr.message + '="' + target.$element[0].name + '"]', this.$form);
        }
    }, {
        key: 'hideErrors',
        value: function hideErrors(target) {
            this.errorLabelFor(target).html('').removeClass(XValidate.Constants.classes.messageInvalid).addClass(XValidate.Constants.classes.messageValid);
        }
    }, {
        key: 'invalidCount',
        value: function invalidCount(value) {
            return XValidate.Utils.data(this.$form, XValidate.Constants.dataAttr.invalidCount, value);
        }
    }, {
        key: 'onValidateRequired',
        value: function onValidateRequired(callback) {
            var _this = this;

            var run = function run(e) {
                return callback.apply(_this, e);
            };

            if (this.$form.is('form')) {
                this.$form.on('submit', run);
                return;
            }
            $('button', this.$form).on('click', run);
            return;
        }
    }, {
        key: 'showError',
        value: function showError(target) {
            this.errorLabelFor(target).html(this.errorLabelFor(target).html() + 'error message ').removeClass(XValidate.Constants.classes.messageValid).addClass(XValidate.Constants.classes.messageInvalid);
        }
    }, {
        key: 'targets',
        value: function targets() {
            var _this2 = this;

            var elements = $('[data-' + XValidate.Constants.attr.element + ']', this.$form);
            return $.map(elements, function (element) {
                return new XValidate.Target(_this2, $(element));
            });
        }
    }, {
        key: 'trigger',
        value: function trigger(name) {
            this.$form.trigger(name);
        }
    }, {
        key: 'validating',
        value: function validating(value) {
            return this.$form.data(XValidate.Constants.dataAttr.validating, value);
        }
    }]);

    return Form;
}();

XValidate.Target = function () {
    function Target(form, $element) {
        _classCallCheck(this, Target);

        this.form = form;
        this.$element = $element;
    }

    _createClass(Target, [{
        key: 'data',
        value: function data() {
            return JSON.parse(this.dataTemplate().replace('{0}', this.$element.val()));
        }
    }, {
        key: 'dataTemplate',
        value: function dataTemplate() {
            if (this.$element[0].hasAttribute('data-' + XValidate.Constants.attr.data)) {
                return JSON.stringify(this.$element.data(XValidate.Constants.attr.data));
            }
            return '{ "' + this.$element[0].name || this.$element[0].id + '":"{0}"}';
        }
    }, {
        key: 'url',
        value: function url() {
            return this.$element.data(XValidate.Constants.attr.url);
        }
    }, {
        key: 'valid',
        value: function valid(value) {
            if (value === false) {
                this.form.invalidCount(this.form.invalidCount() + 1);
                this.form.showError(this);
            }
            return this.$element.data(XValidate.Constants.dataAttr.valid, value);
        }
    }]);

    return Target;
}();

XValidate.Validator = function () {
    function Validator(form) {
        _classCallCheck(this, Validator);

        this.form = form;
    }

    _createClass(Validator, [{
        key: 'start',
        value: function start() {
            this.form.trigger(XValidate.Constants.events.validating);
            this.form.validating(true);
            this.form.invalidCount(0);
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.form.validating(false);
            this.form.trigger(XValidate.Constants.events.validated);
        }
    }, {
        key: 'validate',
        value: function validate() {
            if (this.form.validating() === true) {
                return;
            }

            this.start();

            var targets = this.form.targets();
            var requests = this.createRequests(targets);
            var form = this.form;
            Promise.all(requests).then(function (results) {
                for (var i = 0; i < results.length; i++) {
                    var target = targets[i];
                    // todo: handle multiple vals per target
                    form.hideErrors(target);
                    var result = results.length === 1 ? results[0] : results[i][0];
                    // todo: configure result eval. ***Plugin***
                    var isValid = result === true;
                    target.valid(isValid);
                }
            });
        }
    }, {
        key: 'createRequest',
        value: function createRequest(target) {
            return $.ajax({
                url: target.url(),
                data: target.data()
            });
        }
    }, {
        key: 'createRequests',
        value: function createRequests(targets) {
            var _this3 = this;

            return $.map(targets, function (target) {
                return _this3.createRequest(target);
            });
        }
    }], [{
        key: 'events',
        get: function get() {
            return {
                validating: 'xval.validating',
                validated: 'xval.validated'
            };
        }
    }]);

    return Validator;
}();

(function ($) {
    $.fn.xvalidate = function (options) {
        return this.each(function () {
            var form = new XValidate.Form($(this));
            var validator = new XValidate.Validator(form);
            form.onValidateRequired(function () {
                return validator.validate();
            });
        });
    };
})(jQuery);

$(function () {
    /*default implementation*/
    var forms = $('[data-xval-form]').xvalidate();
    console.log(forms);
});