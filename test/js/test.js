XValidate.Plugins.add('test-plugin', function(result) {
    console.log(result);
    return false;
});

XValidate.Plugins.add('test-plugin', function() {
    alert('I should not be called, as I was already added'); 
});