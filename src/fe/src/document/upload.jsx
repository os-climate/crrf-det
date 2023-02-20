import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { config } from '../shared/config';
import { auth } from '../shared/user';


let upload_files = [];
let upload_toast_id = null;
let uploading = false;


function do_upload(refresh, path) {
  if (uploading)
    return;

  if (upload_files.length > 0) {
    uploading = true;
    var file = upload_files[0];
    upload_files = upload_files.slice(1);

    let xhr = new XMLHttpRequest();
    xhr.upload.onprogress = function(e) {
      var percent = Math.round(100 * e.loaded / e.total);
      toast.loading(<Uploader name={ file.name } left={ upload_files.length } percent={ percent } />, {
        id: upload_toast_id
      });
    };
    xhr.upload.onerror = function() {
      uploading = false;
    };
    xhr.onload = function() {
      setTimeout(() => {
        uploading = false;
        do_upload(refresh, path);
        refresh(path);
      });
    };
    let apiPath = '/files/new';
    if (path)
      apiPath += '/' + path;
    xhr.open('POST', config.endpoint_base + apiPath);
    xhr.setRequestHeader('Authorization', 'Bearer ' + auth.getToken());
    var form = new FormData();
    form.append('file', file);
    xhr.send(form);

    if (upload_toast_id) {
      toast.loading(<Uploader name={ file.name } left={ upload_files.length } percent={ 0 } />, {
        id: upload_toast_id
      });
    } else {
      upload_toast_id = toast.loading(<Uploader name={ file.name } left={ upload_files.length } percent={ 0 } />, {
        position: 'bottom-right'
      });
    }
  }
  else if (upload_toast_id) {
    toast.success(<Uploader/>, {
      id: upload_toast_id
    });
    refresh(path);
    upload_toast_id = null;
  }
}


function queue_upload_files(files) {
  upload_files = upload_files.concat(files);
}


function init_dropzone(path, refresh) {
  return useDropzone({
    /*
    return value is { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open }
     */
    accept: {
      'application/pdf': ['.pdf']
    },
    noClick: true,
    onDrop: acceptedFiles => {
      if (acceptedFiles.length === 0) {
        toast.error(<span>Only files with <span className="font-bold">.pdf</span> extension are accepted.</span>, {
          duration: 5000,
          position: 'bottom-right'
        })
        return;
      }
      queue_upload_files(acceptedFiles);
      do_upload(refresh, path);
    }
  });
}


function Uploader({ name, left, percent }) {
  if (!name)
    return (
      <div>
        <div>All files uploaded.</div>
      </div>
    )

  return (
    <div>
      <div className="text-left"><strong>Uploading</strong> {name} { left > 0 ? (<strong>{left} left</strong>):(null) } ...</div>
      <progress className="progress progress-primary w-56" value={ percent } max="100"></progress>
    </div>
  )
}


export {
  init_dropzone,
};
