(function() {
    // modify jquery ajax for mocking
    $.ajax = function(options) {
        setTimeout(function() {

        }, 500);
    };
    // add mock plugins
    XValidate.Plugins.add({
        name: 'mock',
        url: 'mock'
    });

    QUnit.test('xval.validating-is-triggered-on-form-submit', function(assert) {
        assert.expect(1);
        var done = assert.async();

        var $form = $('<form></form>').xvalidate();
        $form.on(XValidate.Constants.events.validating, function() {
            assert.ok(true);
            done();
        });
        $form.trigger('submit', {});
    });

    QUnit.test('xval.validating-is-triggered-on-div-button-click', function(assert) {
        assert.expect(1);
        var done = assert.async();

        var $form = $('<div><button type="button"></button></div>').xvalidate();
        var $button = $('button', $form);
        $form.on(XValidate.Constants.events.validating, function() {
            assert.ok(true);
            done();
        });
        $button.trigger('click', {});
    });

    QUnit.test('xval.validating-is-triggered-on-div-link-click', function(assert) {
        assert.expect(1);
        var done = assert.async();

        var $form = $('<div><a data-xval-submit></a></div>').xvalidate();
        var $link = $('a', $form);
        $form.on(XValidate.Constants.events.validating, function() {
            assert.ok(true);
            done();
        });
        $link.trigger('click', {});
    });
})();