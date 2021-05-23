export const EventTypes = {
    // Event fired when a result file is ready
    fileData: 'FILE_DATA',

    //Event fired when file extraction starts
    extraction: 'EXTRACTION',

    //Event fired when computing starts
    computing: 'COMPUTING',

    // Event fired when file already exists
    fetching: 'FETCHING',

    // Event fired once all files have been written to results
    endOfWrite: 'END_OF_WRITE',

    // Event fired when user logs in
    login: 'LOGIN',

    // Event fired when user refreshes page
    updateSocketId: 'UPDATE_SOCKET_ID',

    // Event fired when user socket is updated
    socketIdUpdated: 'SOCKET_ID_UPDATED',

    // Event emitted when user disconnects and reconnects
    reconnectionSocket: 'RECONNECTION_SOCKET',

    // Event fired when download is ongoing
    downloadProgress: 'DOWNLOAD_PROGRESS',

    // Event fired when download is complete and write is done
    writingDone: 'WRITING_DONE',

    // Event fired when profile download is done
    endOfDownload: 'END_OF_DOWNLOAD',
}
