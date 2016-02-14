QUnit.test('jquery-plugin-returns-a-form', function(assert) {
    var $form = $('<form></form>');
    var $result = $form.xvalidate();
    assert.equal(true, $result.is('form'));
});