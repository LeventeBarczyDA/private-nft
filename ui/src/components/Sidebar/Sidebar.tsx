import React from "react";
import { Link, withRouter, RouteComponentProps } from "react-router-dom";
import { Location } from "history";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListIcon from "@material-ui/icons/List";
import LocalPlay from "@material-ui/icons/LocalPlay";
import useStyles from "./styles";
import { MonetizationOn, SupervisorAccount, Image } from "@material-ui/icons";

type SidebarLinkProps = {
  path : string
  icon : JSX.Element
  label : string
  location : Location<unknown>
}

const Sidebar = ({ location } : RouteComponentProps) => {
  const classes = useStyles();

  return (
    <Drawer open variant="permanent" className={classes.drawer} classes={{ paper: classes.drawer }}>
      <div className={classes.toolbar} />
      <List style={{ width: "100%" }}>
        <SidebarLink key={0} label="My Tokens" path="/app/mytokens" icon={(<LocalPlay />)} location={location} />
        <SidebarLink key={1} label="My Works" path="/app/myworks" icon={(<Image />)} location={location} />
        <SidebarLink key={2} label="Payments" path="/app/payments" icon={(<MonetizationOn />)} location={location} />
        <SidebarLink key={3} label="User Admin" path="/app/useradmin" icon={(<SupervisorAccount />)} location={location} />
      </List>
    </Drawer>
  );
};

const SidebarLink = ({ path, icon, label, location } : SidebarLinkProps) => {
  const classes = useStyles();
  const active = path && (location.pathname === path || location.pathname.indexOf(path) !== -1);

  return (
    <ListItem button component={Link} to={path} className={classes.link} classes={{ root: active ? classes.linkActive : classes.linkRoot }} disableRipple>
      <ListItemIcon className={active ? classes.linkIconActive : classes.linkIcon}>{icon}</ListItemIcon>
      <ListItemText classes={{ primary: active ? classes.linkTextActive : classes.linkText }} primary={label} />
    </ListItem>
  );
}

export default withRouter(Sidebar);
