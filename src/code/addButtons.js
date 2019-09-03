import LinkDialog from "./linkDialog";
import { MarkerDialog } from "./markerDialog";
import { OpsDialog } from "./opsDialog";
import Operation from "./operation";
import QuickDrawControl from "./quickDrawLayers";

var Wasabee = window.plugin.Wasabee;

/* This function adds the plugin buttons on the left side of the screen */
export default function() {
  const ButtonsControl = L.Control.extend({
    options: {
      position: "topleft"
    },
    onAdd: function(map) {
      var container = L.DomUtil.create("div", "leaflet-arcs leaflet-bar");
      this._modes = {};

      this._addQuickDrawButton(map, container);

      $(container)
        .append(
          '<a id="wasabee_viewopsbutton" href="javascript: void(0);" class="wasabee-control" title="Manage Operations"><img src=' +
            Wasabee.static.images.toolbar_viewOps +
            ' style="vertical-align:middle;align:center;" /></a>'
        )
        .on("click", "#wasabee_viewopsbutton", function() {
          OpsDialog.update(Wasabee.opList);
        });
      $(container)
        .append(
          '<a id="wasabee_addlinksbutton" href="javascript: void(0);" class="wasabee-control" title="Add Links"><img src=' +
            Wasabee.static.images.toolbar_addlinks +
            ' style="vertical-align:middle;align:center;" /></a>'
        )
        .on("click", "#wasabee_addlinksbutton", function() {
          var selectedOp = window.plugin.wasabee.getSelectedOperation();
          if (selectedOp != null) {
            LinkDialog.update(selectedOp, true);
          } else {
            window.alert("No selected Operation found.");
          }
        });
      $(container)
        .append(
          '<a id="wasabee_addmarkersbutton" href="javascript: void(0);" class="wasabee-control" title="Add Markers"><img src=' +
            Wasabee.static.images.toolbar_addMarkers +
            ' style="vertical-align:middle;align:center;" /></a>'
        )
        .on("click", "#wasabee_addmarkersbutton", function() {
          var selectedOp = window.plugin.wasabee.getSelectedOperation();
          if (selectedOp != null) {
            MarkerDialog.update(selectedOp);
          } else {
            window.alert("No selected Operation found.");
          }
        });
      $(container)
        .append(
          '<a id="wasabee_addopbutton" href="javascript: void(0);" class="wasabee-control" title="Add Op"><img src=' +
            Wasabee.static.images.toolbar_plus +
            ' style="vertical-align:middle;align:center;" /></a>'
        )
        .on("click", "#wasabee_addopbutton", function() {
          window.plugin.wasabee.showAddOpDialog();
        });

      $(container)
        .append(
          '<a id="wasabee_clearopsbutton" href="javascript: void(0);" class="wasabee-control" title="Clear All Ops"><img src=' +
            Wasabee.static.images.toolbar_delete +
            ' style="vertical-align:middle;align:center;" /></a>'
        )
        .on("click", "#wasabee_clearopsbutton", function() {
          var confirmed = window.confirm(
            "Are you sure you want to clear ALL operations?"
          );
          if (confirmed) {
            window.plugin.wasabee.resetOpList();
            window.plugin.wasabee.setupLocalStorage();
            OpsDialog.closeDialogs();
          }
        });

      $(container)
        .append(
          '<a id="wasabee_syncbutton" href="javascript: void(0);" class="wasabee-control" title="Get All Ops"><img src=' +
            Wasabee.static.images.toolbar_download +
            ' style="vertical-align:middle;align:center;" /></a>'
        )
        .on("click", "#wasabee_syncbutton", function() {
          try {
            LinkDialog.closeDialogs();
            OpsDialog.closeDialogs();
            MarkerDialog.closeDialogs();
            window.plugin.wasabee.authWithWasabee();
          } catch (e) {
            window.plugin.wasabee.showMustAuthAlert();
          }
        });

      var selectedOp = window.plugin.wasabee.getSelectedOperation();
      var opIsOwnedServerOp = window.plugin.wasabee.opIsOwnedServerOp(
        selectedOp.ID
      );
      var opIsServerOp = window.plugin.wasabee.opIsServerOp(selectedOp.ID);
      if (
        opIsOwnedServerOp ||
        (opIsOwnedServerOp !== true && opIsServerOp !== true)
      ) {
        $(container)
          .append(
            '<a id="wasabee_uploadbutton" href="javascript: void(0);" class="wasabee-control" title="Push To Server"><img src=' +
              Wasabee.static.images.toolbar_upload +
              ' style="vertical-align:middle;align:center;" /></a>'
          )
          .on("click", "#wasabee_uploadbutton", function() {
            var opIsInLocalStorage = window.plugin.wasabee.opIsServerOp(
              selectedOp.ID
            );
            if (opIsInLocalStorage) {
              window.plugin.wasabee.updateSingleOp(
                Operation.create(selectedOp)
              );
            } else {
              window.plugin.wasabee.uploadSingleOp(
                Operation.create(selectedOp)
              );
            }
          });
      }
      return container;
    },
    _addQuickDrawButton: function(map, container) {
      let quickDrawHandler = new QuickDrawControl(map);
      let type = quickDrawHandler.type;
      this._modes[type] = {};
      this._modes[type].handler = quickDrawHandler;
      this._modes[type].button = this._createButton({
        title: "Quick Draw Layers",
        container: container,
        buttonImage: window.plugin.Wasabee.static.images.toolbar_quickdraw,
        callback: quickDrawHandler.enable,
        context: quickDrawHandler
      });
      let actionsContainer = this._createActions([
        {
          title: "Click to stop drawing fields.",
          text: "Cancel",
          callback: quickDrawHandler.disable,
          context: quickDrawHandler
        }
      ]);
      L.DomUtil.addClass(actionsContainer, "leaflet-draw-actions-top");

      this._modes[type].actionsContainer = actionsContainer;

      quickDrawHandler.on(
        "enabled",
        function() {
          actionsContainer.style.display = "block";
        },
        this
      );
      quickDrawHandler.on(
        "disabled",
        function() {
          actionsContainer.style.display = "none";
        },
        this
      );
      container.appendChild(actionsContainer);
    },
    _createActions: function(buttons) {
      var container = L.DomUtil.create("ul", "leaflet-draw-actions"),
        l = buttons.length,
        li;

      for (var i = 0; i < l; i++) {
        li = L.DomUtil.create("li", "", container);

        this._createButton({
          title: buttons[i].title,
          text: buttons[i].text,
          container: li,
          callback: buttons[i].callback,
          context: buttons[i].context
        });
      }

      return container;
    },
    _createButton: function(options) {
      var link = L.DomUtil.create(
        "a",
        options.className || "",
        options.container
      );
      link.href = "#";

      if (options.text) {
        link.innerHTML = options.text;
      }

      if (options.buttonImage) {
        $(link).append(
          $("<img/>")
            .prop("src", options.buttonImage)
            .css("vertical-align", "middle")
            .css("align", "center")
        );
      }

      if (options.title) {
        link.title = options.title;
      }

      L.DomEvent.on(link, "click", L.DomEvent.stopPropagation)
        .on(link, "mousedown", L.DomEvent.stopPropagation)
        .on(link, "dblclick", L.DomEvent.stopPropagation)
        .on(link, "click", L.DomEvent.preventDefault)
        .on(link, "click", options.callback, options.context);

      return link;
    }
  });
  if (Wasabee.buttons != null) {
    return;
  }
  Wasabee.buttons = new ButtonsControl();
  window.map.addControl(Wasabee.buttons);
}
