angular.module('app.controllers', [])

// Home controller
.controller('homeCtrl', function ($scope, $cookies) {
  $scope.username = $cookies.get("username");
  $cookies.currentPolish = null;
})

// Loading screen
.controller('loadCtrl', function ($scope,$state, $q, $cookies, drupal){
    $q.all([
      drupal.views_json("user/" + $cookies.get("uid") + "/my-rack").then(function(nodes) {
        $cookies.myRack = nodes;
      }),
      drupal.views_json("user/" + $cookies.get("uid") + "/wish-list").then(function(nodes) {
        $cookies.myWishList = nodes;
      }),
      drupal.views_json("tyr/all-polish").then(function(nodes) {
        $cookies.allPolishes = nodes;
      })
    ]).then(function(results) {
      $state.go('tabsController.home', {}, {reload: true});
    })
})

// Polish page controller
.controller('polishCtrl', function ($scope, $state, drupal, $cookies, $q, $ionicPopup, $filter, PolishService) {
  $scope.inRack = false;
  $scope.inWishList = false;
  $scope.curPolish = $cookies.currentPolish;
  var loadPopup = null;

  var pIndex = 0;
  var finRack = $cookies.myRack.filter(function(p) {
    return p.title === $scope.curPolish.title;
  });

  if(finRack.length > 0){
    $scope.inRack = true;
  }

  var finWishList = $cookies.myWishList.filter(function(p) {
    return p.title === $scope.curPolish.title;
  });

  if(finWishList.length > 0){
    $scope.inWishList = true;
  }

  $scope.showAlert = function() {
    loadPopup = $ionicPopup.show({
       title: 'Updating',
       template: 'Please wait one moment, we\'re updating your list! <br/> <ion-spinner align="center"></ion-spinner>',
       buttons: null
    });
  }

  $scope.addToRack = function (){
    $scope.showAlert();
    PolishService.addRack($cookies.currentPolish).then( function(result){
      $scope.inRack = true;
      loadPopup.close();
    })
  }

  $scope.addToWishList = function() {
    $scope.showAlert();
    PolishService.addWishList($cookies.currentPolish).then( function(result){
      $scope.inWishList = true;
      loadPopup.close();
    })
  }

  $scope.removeFromRack = function() {
    $scope.showAlert();
    PolishService.removeRack($cookies.currentPolish).then( function(result){
      $scope.inRack = false;
      loadPopup.close();
    })
  }

  $scope.removeFromWishList = function() {
    $scope.showAlert();
    PolishService.removeWishList($cookies.currentPolish).then( function(result){
      $scope.inWishList = false;
      loadPopup.close();
    })
  }

  $scope.updatePolish = function( ){
    $state.go('tabsController.addPolish');
  }
 })

// Profile controller
.controller('profileCtrl', function ($scope) {

 })

// Following controller
.controller('friendsCtrl', ['$scope', '$stateParams', function ($scope, $stateParams) {


}])

// Chat controller
.controller('chatCtrl', ['$scope', '$stateParams', function ($scope, $stateParams) {


}])

// About controller
.controller('aboutCtrl', ['$scope', '$stateParams', function ($scope, $stateParams) {


}])

// Database controller
.controller('browseCtrl', function ($scope, $state, $cookies, SessionService, $ionicScrollDelegate, $ionicPopup, PolishService) {
  $scope.editMode = false;
  $scope.form = {};
  $scope.data = {};
  $scope.checks = [];
  $scope.emptyResults = true;
  $scope.bpolishes = [];
  $scope.cur_db_polishes = [];
  $scope.tempPolishes = $cookies.myRack;

  $scope.bpolishes = $cookies.allPolishes;
  $scope.bbrands = [];
  $scope.bcollections = [];
  $scope.bpolishes.forEach(function (polish) {
    if($scope.bbrands.indexOf(polish.Brand) === -1 ) {
      $scope.bbrands.push(polish.Brand);
    }
    if(($scope.bcollections.indexOf(polish.Collection) === -1) && polish.Collection !== "" ) {
      $scope.bcollections.push(polish.Collection);
    }
  })

  $scope.setEditMode = function (){
    if($scope.editMode){
      $scope.editMode = false;
    }else {
      $scope.editMode = true;
    }
  }

  $scope.setFlag = function(cPolish){
    if($scope.checks[cPolish.nid]){
      $scope.checks[cPolish.nid] = false;
    }
    else{
      $scope.checks[cPolish.nid] = true;
    }
  }

  $scope.showAlert = function() {
    loadPopup = $ionicPopup.show({
       title: 'Updating',
       template: 'Please wait one moment, we\'re updating your rack! <br/> <ion-spinner align="center"></ion-spinner>',
       buttons: null
    });
  }

  $scope.bulkFlag = function () {
    $scope.showAlert();
    // Checks through all polishes to see if it's flagged or not; Must be a better way to do this
    $cookies.allPolishes.forEach(function (p){
      var finRack = $cookies.myRack.filter(function(pol) {
          return pol.title === p.title;
        });
        if(finRack.length && $scope.checks[p.nid] === false){
          // In rack, unselected, so unflag the node
          PolishService.removeRack(p).then( function(result){ })
        }else if(!finRack.length && $scope.checks[p.nid] === true){
          // Not in rack, selected, so flag
          PolishService.addRack(p).then( function(result){ })
        }
      // Else ignore and do nothing
    })
    loadPopup.close();
  }

  $scope.filter_db = function(data){
    $scope.emptyResults = false;
    $scope.cur_db_polishes = {};
    var selbrand = false;
    var selcollection = false;
    var filtered_db = [];
    var ex_filtered_db = [];
    if(data == undefined){
      filtered_db = [];
      $scope.emptyResults = true;
    }else{
      $cookies.allPolishes.forEach(function (cur_polish){
        var finRack = $cookies.myRack.filter(function(p) {
          return p.title === cur_polish.title;
        });
        if(finRack.length > 0){
          $scope.checks[cur_polish.nid] = true;
        }else{
          $scope.checks[cur_polish.nid] = false;
        }
        if(cur_polish.Brand === data.selectedBrand){
          filtered_db.push(cur_polish);
          selbrand = true;
        }
        if(cur_polish.Collection === data.selectedCollection){
          filtered_db.push(cur_polish);
          selcollection = true;
        }
      })
      if(selcollection && selbrand){
        filtered_db.forEach(function (pol) {
          if(pol.Brand === data.selectedBrand && pol.Collection === data.selectedCollection)
            ex_filtered_db.push(pol);
        })
        $scope.cur_db_polishes = ex_filtered_db;
      }else{
        $scope.cur_db_polishes = filtered_db;
      }
    }
  }

  $scope.showAll = function(){
    $scope.cur_db_polishes = $cookies.allPolishes;
    $scope.emptyResults = false;
  }

  $scope.goToPolish = function(data){
    if($scope.editMode){
      $scope.setFlag(data);
    }else{
      SessionService.setCurrentPolish(angular.copy(data));
      $scope.clear_filter();
      $state.go('tabsController.polish');
    }
  }

  $scope.clear_filter = function(){
    $scope.original = {};
    $scope.data = angular.copy($scope.original);
    $scope.form.database.$setPristine();
    $scope.bpolishes = angular.copy($scope.original);
    $scope.cur_db_polishes = {};
    $scope.emptyResults = true;
    $scope.editMode = false;
  }

   $scope.scrollUp = function(){
    $ionicScrollDelegate.scrollTop();
  }
})


// Wish List controller
.controller('wishListCtrl', function ($state, $scope, drupal, $cookies, SessionService, $ionicScrollDelegate) {
  $scope.form = {};
  $scope.data = {};

// Fill in the filters
  $scope.emptyResults = true;
  $scope.wpolishes = $cookies.myWishList;
  $scope.wbrands = [];
  $scope.wcollections = [];
  $scope.wpolishes.forEach(function (polish) {
    if($scope.wbrands.indexOf(polish.Brand) === -1 ) {
      $scope.wbrands.push(polish.Brand);
    }
    if(($scope.wcollections.indexOf(polish.Collection) === -1) && polish.Collection !== "" ) {
      $scope.wcollections.push(polish.Collection);
    }
  })

// Return entire wish list
$scope.fullWish = function(){
  $scope.fil_polishes = $cookies.myWishList;
  $scope.emptyResults = false;
}

// Filter wish list for output
$scope.filterWish = function(data){
  $scope.emptyResults = false;
  var selbrand = false;
  var selcollection = false;
  $scope.fil_polishes = [];
  $scope.wpolishes.forEach(function (cur_polish){
    if(cur_polish.Brand === data.selectedBrand){
      $scope.fil_polishes.push(cur_polish);
      selbrand = true;
    }
    if(cur_polish.Collection === data.selectedCollection){
      $scope.fil_polishes.push(cur_polish);
      selcollection = true;
    }
  })
  $scope.fil_polishes.forEach(function (c_polish){
    if(selbrand && selcollection){

    }
  })
  if($scope.fil_polishes.length == 0){
    $scope.emptyResults = true;
  }
}

$scope.reset_form = function(){
    $scope.original = {};
    $scope.data = angular.copy($scope.original);
    $scope.form.wishList.$setPristine();
    $scope.fil_polishes = {};
    $scope.wpolishes = angular.copy($scope.original);
    $scope.emptyResults = true;
  }

  $scope.openPolish = function(data){
    SessionService.setCurrentPolish(angular.copy(data));
    $scope.reset_form();
    $state.go('tabsController.polish');
  }

  $scope.scrollUp = function(){
    $ionicScrollDelegate.scrollTop();
  }
})


// My Rack controller
.controller('myRackCtrl', function ($state, $scope, drupal, $cookies, SessionService, $ionicScrollDelegate) {
  $scope.currentBrand = false;
  $scope.form = {};
  $scope.data = {};
  $scope.randomPolish = "";
  $scope.rackPolishes = $cookies.myRack.length;

  // Fill in the filters
  $scope.emptyResults = true;
  $scope.mpolishes = $cookies.myRack;
  $scope.mbrands = [];
  $scope.mcollections = [];
  $scope.mpolishes.forEach(function (polish) {
    if($scope.mbrands.indexOf(polish.Brand) === -1 ) {
      $scope.mbrands.push(polish.Brand);
    }
    if(($scope.mcollections.indexOf(polish.Collection) === -1) && polish.Collection !== "" ) {
      $scope.mcollections.push(polish.Collection);
    }
  })

  $scope.numBrands = $scope.mbrands.length;


  // Return a random polish in the user's rack
  $scope.spinWheel = function() {
    $scope.randomPolish=$cookies.myRack[Math.floor(Math.random() * $cookies.myRack.length)].title;
  }

  // Spits out a random color
  $scope.randomColor = function () {
    // Random hex code
    var color = '#'+Math.floor(Math.random()*16777215).toString(16);
    $scope.bgColor=color;
}

  // Return entire rack
  $scope.fullRack = function(){
    $scope.fil_polishes = $cookies.myRack;
    $scope.emptyResults = false;
  }

  // Filter rack for output
  $scope.filterRack = function(data){
    $scope.currentBrand = true;
    $scope.mpolishes = $cookies.myRack;
    $scope.emptyResults = false;
    var selbrand = false;
    var selcollection = false;
    $scope.fil_polishes = [];
    $scope.mpolishes.forEach(function (cur_polish){
      if(cur_polish.Brand === data.selectedBrand){
        $scope.fil_polishes.push(cur_polish);
        selbrand = true;
      }
      if(cur_polish.Collection === data.selectedCollection){
        $scope.fil_polishes.push(cur_polish);
        selcollection = true;
      }
    })
    $scope.fil_polishes.forEach(function (c_polish){
      if(selbrand && selcollection){

      }
    })
    if($scope.fil_polishes.length == 0){
      $scope.emptyResults = true;
    }
    $scope.sel_brand = data.selectedBrand;
    $scope.brandPolishes = $scope.fil_polishes.length;
  }

  $scope.reset_form = function(){
    $scope.original = {};
    $scope.data = angular.copy($scope.original);
    $scope.form.myRack.$setPristine();
    $scope.fil_polishes = {};
    $scope.mpolishes = angular.copy($scope.original);
    $scope.emptyResults = true;
  }

  $scope.openPolish = function(polish){
    SessionService.setCurrentPolish(angular.copy(polish));
    $scope.reset_form();
    $state.go('tabsController.polish');
  }

  $scope.scrollUp = function(){
    $ionicScrollDelegate.scrollTop();
  }
})

// Scanner controller
.controller('scannerPopupCtrl', ['$scope', '$stateParams', function ($scope, $stateParams) {


}])

// Add polish to database controller
.controller('addPolishCtrl', function ($scope, $stateParams, CONSTANTS, $state, drupal, $cookies, $ionicPopup, $q, PolishService) {
  $scope.data = { };
  $scope.form = { };
  $scope.aBrands = $cookies.allPolishes;
  $scope.brandNames = [ ];
  loadPopup = null;

  $scope.aBrands.forEach(function (polish) {
    if($scope.brandNames.indexOf(polish.Brand) === -1 ) {
      $scope.brandNames.push(polish.Brand);
    }
  })

  if($cookies.currentPolish){
    $scope.data.pName = $cookies.currentPolish.title;
  }

  $scope.reset_form = function(){
    $scope.original = {};
    $scope.data = angular.copy($scope.original);
    $scope.form.editPolish.$setPristine();
  }

  $scope.showLoading = function() {
    loadPopup = $ionicPopup.alert({
       title: 'Updating',
       template: 'Please wait one moment, we\'re updating our server! <br/> <ion-spinner></ion-spinner>',
       buttons: null
    });
  }

  $scope.fill = function(){
    $scope.data.pName = $cookies.currentPolish.title;
    $scope.data.pBrand = $cookies.currentPolish.Brand;
    $scope.data.pCollection = $cookies.currentPolish.Collection;
    $scope.data.pFinish = $cookies.currentPolish.Finish;
    $scope.data.pYear = $cookies.currentPolish.Year;
    $scope.data.pSeason = $cookies.currentPolish.Season;
    $scope.data.pNumber = $cookies.currentPolish.Number;
    $scope.data.pSite = $cookies.currentPolish.Site;

    var finRack = $cookies.myRack.filter(function(p) {
      return p.title === $cookies.currentPolish.title;
    });

    if(finRack.length > 0){
      $scope.data.addToRack = true;
      $scope.inMyRack = true;
    }

    var finWishList = $cookies.myWishList.filter(function(p) {
      return p.title === $cookies.currentPolish.title;
    });

    if(finWishList.length > 0){
      $scope.inMyWishList = true;
      $scope.data.addToWishList = true;
    }
  }

  $scope.checkPolish = function(){
    if($cookies.currentPolish){
      $scope.fill();
    }
  }
 $scope.checkPolish();

  $scope.clearBrand = function (){
    if($scope.newBrand){
      $scope.newBrand = false;
    }else {
      $scope.newBrand = true;
    }
    $scope.data.selBrand="";
    $scope.data.pBrand = "";
  }

  $scope.createPolish = function(polish){
    if(!polish.pName){
        missingName = $ionicPopup.alert({
        title: 'Missing Value',
        template: 'Please enter the polish name.'
      });
      return;
    }
    if(!polish.selBrand && !polish.pBrand){
      missingBrand = $ionicPopup.alert({
        title: 'Missing Value',
        template: 'Please enter the brand.'
      });
      return;
    }

  $scope.showLoading();
    var saveImage;
    if(polish.selBrand){
          var node = {
          type: 'polish',
          title: polish.pName,
          field_collection: { "und": [{ "value": polish.pCollection }] },
          field_finish: { "und": [{ "value": polish.pFinish }] },
          field_polish_brand: { "und": [{ "value": polish.selBrand }] },
          field_polish_number: { "und": [{ "value": polish.pNumber }] },
          field_polish_season: { "und": [{ "value": polish.pSeason }] },
          field_polish_site: { "und": [{ "value": polish.pSite }] },
          field_release_year: { "und": [{ "value": polish.pYear }] }
        };
    }else{
          var node = {
          type: 'polish',
          title: polish.pName,
          field_collection: { "und": [{ "value": polish.pCollection }] },
          field_finish: { "und": [{ "value": polish.pFinish }] },
          field_polish_brand: { "und": [{ "value": polish.pBrand }] },
          field_polish_number: { "und": [{ "value": polish.pNumber }] },
          field_polish_season: { "und": [{ "value": polish.pSeason }] },
          field_polish_site: { "und": [{ "value": polish.pSite }] },
          field_release_year: { "und": [{ "value": polish.pYear }] }
        };
    }
    var data = {};
    var newPol = {};

    if($cookies.currentPolish){
      node.nid = $cookies.currentPolish.nid;
    }

    if(polish.pSwatch){
        var type = polish.pSwatch.filetype.substring(polish.pSwatch.filetype.indexOf("/") + 1);
        var name = polish.pSwatch.filename.replace(/\.[^/.]+$/, "");
        var swatch64 = {
          file:polish.pSwatch.base64,
          filename:name+type,
          filepath:"public://swatches/"+name+"."+type
        }
        saveImage = drupal.file_save(swatch64, $cookies.get("Cookie")).then(function (f) {
        var addFile = { field_polish_swatch: { "und": [{ "fid": f.fid }] } };
        angular.extend(node, addFile );
         $scope.saveNode(node, polish);
      })
    }else{
      $scope.saveNode(node, polish);
    }
  }

    $scope.saveNode = function(node, polish){
      drupal.node_save(node, $cookies.get("Cookie")).then(function(data) {
      // Update all the lists to reflect the new polish
      $cookies.myRack = null;
      $cookies.myWishList = null;
      $cookies.allPolishes = null;

      $q.all([
          drupal.views_json("user/" + $cookies.get("uid") + "/my-rack").then(function(nodes) {
            $cookies.myRack = nodes;
          }),
          drupal.views_json("user/" + $cookies.get("uid") + "/wish-list").then(function(nodes) {
            $cookies.myWishList = nodes;
          }),
          drupal.views_json("tyr/all-polish").then(function(nodes) {
            $cookies.allPolishes = nodes;
          })
        ]).then(function(results) {
          drupal.views_json("polish/" + data.nid).then( function (rnode) {
              var newNode = angular.copy(rnode[0]);
              $cookies.currentPolish = null;
            if(polish.addToRack && !$scope.inMyRack){
                PolishService.addRack(newNode).then( function(result){ })
              }
            if(polish.addToWishList && !$scope.inMyWishList){
              PolishService.addWishList(newNode).then( function(result){ })
            }
            if(!polish.addToRack && $scope.inMyRack){
                PolishService.removeRack(newNode).then( function(result){ })
              }
            if(!polish.addToWishList && $scope.inMyWishList){
              PolishService.removeWishList(newNode).then( function(result){ })
            }
          loadPopup.close();
          $scope.reset_form();
          $state.go('tabsController.home', {}, {reload: true});
          });
          })
        })
    }
})

// Login controller
.controller('loginCtrl', function ($scope, $ionicPopup, $state, drupal, SessionService, $cookies, $window, $location, UserService) {
$scope.data = {};
$scope.dataSent = false;
var loginPopup;

if($cookies.get("Cookie")){
    SessionService.clearCookieData();
    $window.location.reload(true);
}

  $scope.resetPassword = function(){
    $scope.data = {};
    var resetPopup = $ionicPopup.show({
      template: '<input type="text" ng-model="data.user">',
      title: 'Password Reset',
      subTitle: 'Please enter your Email Address or Username associated with your Shellback Software account',
      scope: $scope,
      buttons: [
        { text: 'Cancel', onTap: function(e) { return false; }  },
        {
          text: '<b>Send</b>',
          type: 'button-positive',
          onTap: function(e) {
            UserService.resetPassword($scope.data.user).then(function (result){
              if(result.status === 401){
                passwordReset = $ionicPopup.alert({
                  title: 'Password Reset Failed',
                  template: 'Please type in your Username or Email.'
                });
                return false;
              }else if(result.status === 403){
                passwordReset = $ionicPopup.alert({
                  title: 'Password Reset Failed',
                  template: 'Please enter a valid Username or Email'
                });
                return false;
              }
              else{
                return true;
              }
            })
          }
        }
      ]
    })

    resetPopup.then(function(res) {
    if(res == true){
      passwordReset = $ionicPopup.alert({
        title: 'Password Reset Requested',
        template: 'Please check your email for further instructions.'
      });
      }
    });
  }

  $scope.showBadInfo = function() {
    loginPopup = $ionicPopup.alert({
      title: 'Login failed!',
      template: 'Either your username or password is incorrect.'
    });
  }

  $scope.loginFailed = function(){
    loginPopup = $ionicPopup.alert({
      title: 'Login failed!',
      template: 'Looks there was an error - Wait one moment while we fix this! <br/> <ion-spinner align="center"></ion-spinner>',
       buttons: null
    });
  }

  $scope.login = function(data) {
    $scope.dataSent = true;
    if(!data.username){
      loginPopup = $ionicPopup.alert({
        title: 'Login failed!',
        template: 'Please type in your username.'
      });
      $scope.dataSent = false;
    }else if(!data.password){
      loginPopup = $ionicPopup.alert({
        title: 'Login failed!',
        template: 'Please type in your password.'
      });
      $scope.dataSent = false;
    }else{
      drupal.user_login(data.username, data.password).then(function(result) {
        if (result.status === 403) {
          $scope.showBadInfo();
          $scope.dataSent = false;
        }
        if (result.status === 401) {
          $scope.loginFailed();
           drupal.user_logout($cookies.get("Cookie")).then(function (res) {
            SessionService.clearCookieData();
            loginPopup.close();
            $window.location.reload(true);
          });
          $scope.dataSent = false;
        }
        else{
          SessionService.setCookieData();
          $state.go('loading', {}, {reload: true});
        }
      });
    }
  };
})

// Logout controller
.controller('logoutCtrl', function ($scope, $state, drupal, SessionService, $cookies, $ionicPopup, $window) {
  $scope.showLogout = function() {
    logoutPopup = $ionicPopup.alert({
       title: 'Logging Out',
       template: 'We\'re destroying some credentials, hang tight! <br/> <ion-spinner></ion-spinner>',
       buttons: null
    });
  }

    $scope.logout = function() {
    $scope.showLogout();
      drupal.user_logout($cookies.get("Cookie")).then(function (res) {
        SessionService.clearCookieData();
        logoutPopup.close();
        $state.go('login', {}, {reload: true});
        $window.location.reload(true);
      });
  };
})

// Signup controller
.controller('signupCtrl', function ($scope, $ionicPopup, $state, drupal) {
  $scope.dataSent = false;

$scope.showRegister = function() {
    registerPopup = $ionicPopup.alert({
       title: 'Account Created',
       template: 'Thank you for signing up at Shellback Software! Please check your email to verify your account.',
    });
  }

  $scope.showError = function() {
    errorPopup = $ionicPopup.alert({
       title: 'Invalid Email',
       template: 'Please enter a valid email. ',
    });
  }

  $scope.showIncomplete = function() {
    errorPopup = $ionicPopup.alert({
       title: 'Registration Failed',
       template: 'Please fill out all of the fields and try again. ',
    });
  }

  $scope.register = function(creds) {
    $scope.dataSent = true;
    if(!creds || !creds.username){
      $scope.showIncomplete();
      $scope.dataSent = false;
    }else if(!creds.email){
      $scope.showError();
      $scope.dataSent = false;
    }else {
      var account = {
        name: creds.username,
        mail: creds.email
      }
      drupal.user_register(account).then(function(data) {
        if(data.status === 403){
          var nameError = "";
          var emailError = "";
          var msg = data.statusText.split(':')[1];
          nameError = msg.split(/taken(?=&#?[a-zA-Z0-9]+;)/g)[0];
          if(msg.split(/taken(?=&#?[a-zA-Z0-9]+;)/g)[1]){
          emailError = msg.split(/taken(?=&#?[a-zA-Z0-9]+;)/g)[1];}
          regPopup = $ionicPopup.alert({
             title: 'Registration Failed',
             template: 'We have encountered the following error(s): <br/> '
                      + nameError + '<br/>' + emailError,
          });
          $scope.dataSent = false;
        }else{
          $scope.showRegister();
          $scope.dataSent = false;
        }
      });
    }
  }
})
