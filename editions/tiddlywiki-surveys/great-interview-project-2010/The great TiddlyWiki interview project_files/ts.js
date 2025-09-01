/***
https://raw.github.com/TiddlySpace/ts.js/master/src/ts.js
***/
//{{{
/*jslint vars: true, browser: true */
/*global jQuery, tiddlyweb, confirm, prompt */
//
// version 0.5.12
(function($) {
	"use strict";

	var getCSRFToken = function() {
		// XXX: should not use RegEx - cf.
		// http://www.quirksmode.org/js/cookies.html
		// https://github.com/TiddlySpace/tiddlyspace/commit/5f4adbe009ed4bda3ce39058a3fb07de1420358d
		var regex = /^(?:.*; )?csrf_token=([^(;|$)]*)(?:;|$)/;
		var match = regex.exec(document.cookie);
		var csrf_token = null;
		if (match && (match.length === 2)) {
			csrf_token = match[1];
		}

		return csrf_token;
	};

	$.ajaxSetup({
		beforeSend: function(xhr) {
			xhr.setRequestHeader("X-ControlView", "false");
		}
	});

	window.getCSRFToken = getCSRFToken;

	/*
	 * Add the members of spaceName to the current space.
	 */
	function addMembersfromSpace(ts, spaceName, callback, errback) {
		new tiddlyweb.Space(spaceName, "/").members().get(function(members) {
			var spaceMembers = new tiddlyweb.Space(ts.currentSpace, "/").
				members(),
				putMembers = function(members, callback, errback) {
					var currentMember = members.shift();
					if (currentMember) {
						var next = function() {
							putMembers(members, callback, errback);
						};
						spaceMembers.add(currentMember, next, errback);
					} else {
						callback();
					}
				};
			putMembers(members, callback, errback);
		}, errback);
	}

	/*
	 * Reset the message area associated with the provided form.
	 */
	function resetMessage(form) {
		$(".annotation", form).removeClass("annotation");
		$(".messageArea", form).removeClass("error").hide();
		$(".inputArea", form).show();
	}

	/*
	 * Build message area element
	 */
	function buildMsgArea(form) {
        var msgArea = $("<div class='messageArea' />");
        msgArea
            .append($("<button></button>")
				.html("&times;")
				.addClass("close-btn")
				.attr("title", "close notification")
				.data("parent-class", "messageArea")
				.click( function() {
                    resetMessage(form);
                    return false;
				} )
			)
			.append( $("<p></p>") );

		var container = $("<div />").appendTo(msgArea)[0];
		$("<a />").text("Try again?").click(function() {
			$("input", form)[0].focus();
		}).appendTo(container);

        return msgArea;
	}

	/*
	 * Display a message aligned with the provided form.
	 */
	function displayMessage(form, msg, error, options) {
		options = options || {};
		if(options.hideForm) {
			$(".inputArea", form).hide();
		} else {
			$(".inputArea", form).show();
		}
		var msgArea = $(".messageArea", form);
		if(msgArea.length === 0) {
            msgArea = buildMsgArea(form);
            msgArea.prependTo(form);
		}

        // replace error msg
		msgArea
            .find("p")
                .empty()
                .html(msg || ts.locale.error)
            .end()
            .show(100);

        var errorDiv = msgArea.find("div");
		if(error) {
            msgArea.addClass("error annotation");
            errorDiv.show();
        } else {
            msgArea.removeClass("error");
            errorDiv.hide();
        }
		if(options.annotate) {
			$(options.annotate, form).addClass("annotation");
		}
	}

	/*
	 * Do the default initialization behaviors.
	 */
	function defaultInit(ts, status, callback, options) {
		options = options || {};
		if (status.space && status.space.name &&
				typeof options.space === "undefined") {
			options.space = status.space.name;
		}
		ts.resolveCurrentSpaceName(options, status.server_host.host);
		if(!ts.currentSpace) {
			$(document.body).addClass("ts-unknown-space");
		}
		ts.loadStatus(status);
		if(status.identity || ts.parameters.openid) {
			ts.register_openid(status.identity);
		} else if(status.username && ts.parameters.openid) {
			// open id login occurred so redirect to homespace
			window.location.href = ts.parameters.redirect ||
				ts.getHost(status.username);
		}
		// do login status
		ts.forms.password($("form.ts-password")[0]);
		ts.loginStatus();
		if(ts.currentSpace) {
			ts.initForSpace(status);
		}
		if(callback) {
			callback(ts);
		}
	}

	/*
	 * Parse query parameters into a simple object.
	 */
	function parseParameters(queryString) {
		var args = queryString.split(/[&;]/),
			parameters = {},
			i,
			nameval;
		for(i = 0; i < args.length; i += 1) {
			nameval = args[i].split("=");
			if(nameval.length === 2) {
				parameters[nameval[0]] = nameval[1];
			}
		}
		return parameters;
	}

	/*
	 * add CSRF form fields to the provided form.
	 */
	function addCSRF(form) {
		$("<input type='hidden' name='csrf_token' />").
			val(getCSRFToken()).appendTo(form);
	}

	var ts = {
		currentSpace: false,
		locale: {
			error: "An error occurred",
			tryAgain: "Please try again",
			success: "Clear this notification",
			badLogin: "We are unable to log you in with those details.",
			charError: "Username is invalid - must only contain lowercase " +
				"letters, digits or hyphens",
			spaceSuccess: "Successfully created space.",
			userError: "Username is already taken, please choose another.",
			passwordError: "Passwords do not match",
			passwordLengthError: "Error: password must be at least 6 characters",
			invalidSpaceError: ["error: invalid space name - must start with a ",
				"letter, be at least two characters in length and only contain ",
				"lowercase letters, digits or hyphens"].join("")
		},
		status: {},
		user: {},
		resolveCurrentSpaceName: function(options, host) {
			if(options && typeof options.space !== "undefined") {
				ts.currentSpace = options.space;
			} else if(window.location.protocol !== "file:") {
				var hostname = window.location.hostname;
				if(host.split(".").length < hostname.split(".").length) {
					ts.currentSpace = hostname.split(".")[0];
				}
			}
		},
		isValidSpaceName: function(name) {
			return name.match(/^[a-z][0-9a-z\-]*[0-9a-z]$/) ? true : false;
		},
		init: function(callback, options) {
			ts.parameters = parseParameters(window.location.search.substr(1));
			var status = tiddlyweb.status;
			if (status) {
				defaultInit(ts, status, callback, options);
			}
		},
		initForSpace: function(status) {
			if (/_private$/.test(status.space.recipe)) {
				$(document.body).addClass("ts-member");
				ts.forms.addInclude($("form.ts-includes")[0]);
				ts.forms.addMember($("form.ts-members")[0]);
				ts.forms.addSpace($("form.ts-spaces")[0]);
			} else {
				$(document.body).addClass("ts-nonmember");
			}
			ts.initLists();
		},
		getSpaces: function(callback) {
			if(ts.spaces) {
				callback(ts.spaces);
			} else {
				$.ajax({
					url: "/spaces?mine=1",
					dataType: "json",
					success: function(spaces) {
						ts.spaces = spaces;
						callback(ts.spaces);
					},
					error: function() {
						ts.spaces = false;
					}
				});
			}
		},
		initLists: function() {
			ts.lists.identities();
			ts.lists.members();
			ts.lists.includes();
		},
		loadStatus: function(status) {
			ts.status = status;
			ts.user = {
				name: status.username,
				anon: status.username ? status.username === "GUEST" : true
			};
		},
		getHost: function(subdomain) {
			var s = ts.status;
			var host = s.server_host;
			subdomain = subdomain ? subdomain + "." : "";
			var url = host.scheme + "://" + subdomain + host.host;
			var port = host.port;
			if(port && port !== "80" && port !== "443") {
				url += ":" + port;
			}
			return url;
		},
		login: function(username, password, options) {
			options = options || {};
			var success = options.success || function() {
				window.location = options.redirect || ts.getHost(username);
			};
			// XXX void errback?
			var errback = options.errback || function() {};
			var challenger = options.challenger = options.challenger ||
				"/challenge/tiddlywebplugins.tiddlyspace.cookie_form";
			$.ajax({
				url: challenger,
				type: "POST",
				data: {
					user: username,
					password: password,
					csrf_token: getCSRFToken(),
					// workaround to marginalize automatic subsequent GET
					tiddlyweb_redirect: "/status"
				},
				success: success,
				error: errback
			});
		},
		parameters: {},
		register_openid_for_user: function(username, openid) {
			var user = new tiddlyweb.User(username, null, "/");
			user.identities().add(openid, function() {
				window.location.href = window.location.pathname;
			}, function() {
				throw "failed to add identity to current user.";
			});
		},
		register_openid: function(openid) {
			var space = ts.parameters.space;
			var username = ts.parameters.user;
			if(!space && !username) {
				var answer = confirm(
					"Would you like to create a space with your openid: " +
						openid + "?"
				);
				if(answer) {
					space = prompt("What would you like to be your TiddlySpace username?");
				}
			}
			if(space && openid) {
				var possible =
					"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
				var password = "";
				while(password.length < 16) {
					password += possible.charAt(Math.floor(Math.random() * possible.length));
				}
				// register user with username of space and random password
				ts.register(space, password, null, {
					errback: function() {
						throw "failed at step 1/3";
					},
					success: function() {
						// login as that newly created user
						ts.login(space, password, {
							success: function() {
								ts.register_openid_for_user(space, openid);
							},
							errback: function() {
								throw "failed at step 2/3";
							}
						});
					}
				});
			} else if(username) {
				ts.register_openid_for_user(username, ts.parameters.openid);
			}
		},
		register: function(username, password, form, options) {
			options = options || {};
			var spaceCallback = options.success || function() {
				displayMessage(form, ts.locale.spaceSuccess, false);
				window.location = options.redirect || ts.getHost(username);
			};
            var spaceErrback = function (xhr) {
                // XXX: 409 unlikely to occur at this point
				var msg = xhr.status === 409 ? ts.locale.userError : false;
				displayMessage(form, msg, true, options);
			};
			var userCallback = function() {
				ts.login(username, password, {
					success: function() {
						var space = new tiddlyweb.Space(username, "/");
						space.create(spaceCallback, spaceErrback);
					}
				});
			};
			var userErrback = function(xhr) {
				var msg = xhr.status === 409 ? ts.locale.userError : false;
				displayMessage(form, msg, true, options);
			};
			var user = new tiddlyweb.User(username, password, "/");
			user.create(userCallback, userErrback);
		},
		createSpace: function(form, spaceName, callback, errback) {
			if(ts.isValidSpaceName(spaceName)) {
				var space = new tiddlyweb.Space(spaceName, "/");
				space.create(callback, errback);
			} else {
				displayMessage(form, ts.locale.invalidSpaceError, true);
			}
		},
		changePassword: function(username, password, npassword, form) {
			var pwCallback = function() {
				var msg = "Successfully changed your password.";
				displayMessage(form, msg);
			};
			var pwErrback = function() {
				var msg = "Old password is incorrect.";
				displayMessage(form, msg, true);
			};
			var user = new tiddlyweb.User(username, password, "/");
			user.setPassword(npassword, pwCallback, pwErrback);
		},
		loginStatus: function() {
			var register = $("form.ts-registration");
			var login = $("form.ts-login");
			var logout = $(".ts-logout");

			var user = ts.user;
			$("form.ts-openid").each(function(i, el) {
				ts.forms.openid(el, { user: user });
			});
			if(!user.anon) {
				$(document.body).addClass("ts-loggedin");
				$([register, login]).remove();
				logout.each(function(i, el) {
					ts.forms.logout(el);
				});
			} else {
				if(register) {
					ts.forms.register(register);
				}
				if(login) {
					ts.forms.login(login);
				}
				logout.remove();
			}
		}
	};
	ts.forms = {
		password: function(form) {
			$(form).submit(function(ev) {
				ev.preventDefault();
				var oldPass = $("[name=password]").val();
				var newPass = $("[name=new_password]").val();
				var newPass2 = $("[name=new_password_confirm]").val();
				if(newPass !== newPass2) {
					var msg = "Passwords do not match";
					displayMessage(form, msg, true);
				} else if(newPass.length < 6) {
					displayMessage(form, ts.locale.passwordLengthError, true);
				} else {
					ts.changePassword(ts.user.name, oldPass, newPass, form);
				}
				return false;
			});
		},
		addInclude: function(form) {
			if(!form) {
				return;
			}
			addCSRF(form);
			$(form).submit(function(ev) {
				ev.preventDefault();
				var input = $("input[name=spacename]", form);
				var space = input.val();
				var callback = function() {
					ts.lists.includes($("ul.ts-includes").empty()[0]);
					input.val("");
					var msg = space + " included";
					displayMessage(form, msg, false);
				};
				var errback = function() {
					var msg = "Unable to include space with that name.";
					displayMessage(form, msg, true);
				};
				new tiddlyweb.Space(ts.currentSpace, "/").includes().
					add(space, callback, errback);
			});
		},
		addMember: function(form) {
			if(!form) {
				return;
			}
			addCSRF(form);
			$(form).submit(function(ev) {
				ev.preventDefault();
				var input = $("input[name=username]", form);
				var username = input.val();
				var spaceName = /^@/.test(username) ? username.slice(1) :
						null;
				var callback = function() {
					ts.lists.members($("ul.ts-members").empty()[0]);
					input.val("");
					resetMessage(form);
				};
				var errback = function(xhr) {
					if(xhr.status === 403) {
						displayMessage(form,
							"Unable to add members from a space you " +
							"are not a member of",
							true);
					} else if (xhr.status === 409) {
						displayMessage(form,
							"Unknown username entered.",
							true);
					} else {
						var msg = "Unknown error occurred.";
						displayMessage(form, msg, true);
					}
				};
				if (!spaceName) {
					new tiddlyweb.Space(ts.currentSpace, "/").members().
						add(username, callback, errback);
				} else {
					addMembersfromSpace(ts, spaceName, callback, errback);
				}
			});
		},
		addSpace: function(form) {
			if(!form) {
				return;
			}
			var selector = "[name=spacename]";
			addCSRF(form);
			$(form).submit(function(ev) {
				ev.preventDefault();
				var spaceName = $(selector, form).val() || "";
				var callback = function() {
					var host = ts.getHost(spaceName),
						msg = "Successfully created <a href='" +
							host + "'>" + host + "</a>.";
					displayMessage(form, msg, false);
				};
				var errback = function() {
					var msg = "Problem creating a space with that name.";
					displayMessage(form, msg, true);
				};
				ts.createSpace(form, spaceName, callback, errback);
			});
		},
		register: function(form, options) {
			options = options || {};
			addCSRF(form);
			$(form).submit(function(ev) {
				ev.preventDefault();
				var username = $("[name=username]", form).val();
				var password = $("[name=password]", form).val();
				options.redirect = $("[name=redirect]", form).val();
				var passwordConfirm = $("[name=password_confirm]",
					form).val();
				var validName = ts.isValidSpaceName(username);
				var validLength = password.length >= 6;
				if(validName && validLength && password &&
						password === passwordConfirm) {
					ts.register(username, password, ev.target, options);
				} else {
					var msg = validName ?
							(!validLength ? ts.locale.passwordLengthError :
									ts.locale.passwordError) :
							ts.locale.charError;
					options.annotate = validName ? "[type=password]" :
							"[name=username]";
					displayMessage(form, msg, true, options);
				}
				return false;
			});
		},
		openid: function(form, options) {
			addCSRF(form);
			$(form).attr("method", "post").
				attr("action",
						"/challenge/tiddlywebplugins.tiddlyspace.openid").
				submit(function(ev) {
					var identity = $("input[name=openid]", form).val(),
						space = $("input[name=space]", form).val(),
						user = options && options.user ?
								options.user.name : null;
					if(!identity) {
						ev.preventDefault();
						return displayMessage(form,
							"Please provide an openid!");
					}
					var querystring = "?openid=" + identity;
					if(space) {
						querystring += "&space=" + space;
					}
					if(user) {
						querystring += "&user=" + user;
					}
					var redirect = $("[name=redirect]", form).val();
					if(redirect) {
						querystring += "&redirect=" + redirect;
					}
					// IMPORTANT: #auth:OpenID=<openid> is read by the openid tiddlyweb plugin
					// when present it keeps you logged in as your cookie username
					$("<input name='tiddlyweb_redirect' type='hidden' />").
						val(window.location.pathname + querystring +
								"#auth:OpenID=" + identity).appendTo(form);
				});
		},
		logout: function(form_or_container) {
			if(!form_or_container) {
				return;
			}
			var tag = form_or_container.nodeName;
			var form;
			var isContainer = tag !== "FORM";
			if(isContainer) {
				var uri = ts.getHost(ts.user.name);
				var link = $("<a />").attr({"href": uri,
					"target": "_parent"}).text(ts.user.name)[0];
				var msg = $("<span class='message' />").
					text("Welcome back ").prependTo(form_or_container)[0];
				$(msg).append(link);
				$("<span />").text("!").appendTo(msg);
				form = $("form", form_or_container)[0];
				if(!form) {
					form = $("<form />").appendTo(form_or_container)[0];
					$("<input type='submit' class='button' value='Log out'>").appendTo(form);
				}
			} else {
				form = form_or_container;
			}
			$(form).attr("action", "/logout").attr("method", "post");
			addCSRF(form);
		},
		login: function(form) {
			// do login
			addCSRF(form);
			var options = {
				errback: function(xhr) {
					var code = xhr.status;
					if(code === 401) {
						displayMessage(form, ts.locale.badlogin, true);
					} else {
						displayMessage(form, ts.locale.tryAgain, true);
					}
				}
			};
			function doLogin(ev) {
				var user = $("input[name=username]", form).val();
				var pass = $("input[name=password]", form).val();
				if(!user) {
					return displayMessage(form, "Please provide a username!");
				}
				if(!pass) {
					return displayMessage(form, "Please provide a password!");
				}
				options.redirect = $("input[name=redirect]", form).val();
				options.challenger = $(form).attr("action");
				ts.login(user, pass, options);
				ev.preventDefault();
			}

			$(form).submit(function(ev) {
				doLogin(ev);
			});

			$(form).keypress(function(ev) {
				if(ev.keyCode === 13) {
					doLogin(ev);
				}
			});
		}
	};
	ts.lists = {
		identities: function() {
			var list = $("ul.ts-identities")[0];
			if (list) {
				$(list).addClass("ts-loading");
				var user = new tiddlyweb.User(ts.user.name, null, "/");
				user.identities().get(
					function(identities) {
						var i;
						$(list).removeClass("ts-loading").empty();
						for(i = 0; i < identities.length; i += 1) {
							$("<li />").text(identities[i]).appendTo(list);
						}
					},
					function() {
						$(list).removeClass("ts-loading").empty();
					}
				);
			}
		},
		includes: function() {
			var space = new tiddlyweb.Space(ts.currentSpace, "/");
			var removeInclusion = function(ev) {
				var item = $(ev.target).parents("li")[0];
				var target_space = $(ev.target).data("inclusion");
				var callback = function() {
					$(item).hide(200);
				};
				var errback = function() {};
				space.includes().remove(target_space, callback, errback);
			};
			var list = $("ul.ts-includes").addClass("ts-loading")[0];
			if(list) {
				var callback = function(inclusions) {
					var i, item;
					$(list).removeClass("ts-loading").empty();
					for(i = 0; i < inclusions.length; i += 1) {
						item = $("<li />").appendTo(list)[0];
						$("<a />")
							.text(inclusions[i])
							.attr("href", ts.getHost(inclusions[i]))
							.attr("title", "visit icluded space")
							.appendTo(item);
						addDeleteBtn("inclusion", inclusions[i], item, removeInclusion);
					}
				};
				var errback = function(xhr) {
					$(list).removeClass("ts-loading").empty();
					$("<li class='annotation' />").
						text("Error requesting inclusions:" + xhr.status + " " + xhr.statusText).
						prependTo(list);
				};
				space.includes().get(callback, errback);
			}
		},
		members: function() {
			var space = new tiddlyweb.Space(ts.currentSpace, "/");
			var removeMember = function(ev) {
				var list = $(ev).parents("ul.members")[0];
				var item = $(ev.target).parents("li")[0];
				var member = $(ev.target).data("member");
				var callback = function() {
					$(item).hide(200, function() {
						$(item).remove();
						if($("ul.ts-members li:visible").length > 1) {
							$("button.delete", list).show();
						}
					});
					$("button.delete", list).hide();
				};
				var errback = function() {
					// Um ought to be something here	
				};
				space.members().remove(member, callback, errback);
			};
			var list = $("ul.ts-members").addClass("ts-loading")[0];
			if(list) {
				var callback = function(members) {
					var i, item;
					$(list).removeClass("ts-loading").empty();
					members = members.sort();
					for(i = 0; i < members.length; i += 1) {
						item = $("<li />").appendTo(list)[0];
						$("<a />")
							.text(members[i])
							.attr("href", ts.getHost(members[i]))
							.attr("title", "visit member's home space")
							.appendTo(item);
						if(members.length > 1) {
							addDeleteBtn("member", members[i], item, removeMember);
						}
					}
				};
				var errback = function() {
					$(list).removeClass("ts-loading").empty();
					$("<li class='annotation' />").
						text("Only members can see other members.").
						prependTo(list);
				};
				space.members().get(callback, errback);
			}
		}
	};

	function addDeleteBtn(type, data, item, cb) {
		$("<button />")
			.addClass("delete")
			.data(type, data)
			.attr("title", "remove " + type)
			.html("&times;")
			.click(cb)
			.appendTo(item);
	}

	ts.parseParameters = parseParameters;
	window.ts = {
		init: ts.init
	};

}(jQuery));
//}}}