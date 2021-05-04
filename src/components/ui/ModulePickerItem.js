import "./ModulePickerItem.css";

import { Typography } from "@material-ui/core";

import Icon from '@material-ui/core/Icon';



function ModulePickerItem(props) {

    const thisdata = props.data;
  return (
    <div className="mp-item" onClick={() => props.addNewModule(props.id)}>
        <Typography variant="h6" fontSize="small" color="primary">{thisdata.name}</Typography>
        <Icon color="primary" fontSize="large">{thisdata.icon}</Icon>
        <Typography align="center" variant="body2">{thisdata.description}</Typography>




    </div>
  );
}

export default ModulePickerItem;
