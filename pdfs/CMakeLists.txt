cmake_minimum_required(VERSION 3.10)
set(CMAKE_CXX_STANDARD 17)
project(pdfs)

include(ExternalProject)

# if (${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
#     set(LIBEXT "dylib")
# elseif (${CMAKE_SYSTEM_NAME} MATCHES "Linux")
#     set(LIBEXT "so")
# endif()
set(LIBEXT "a")

ExternalProject_Add(poppler
    URL https://poppler.freedesktop.org/poppler-0.90.1.tar.xz
    CMAKE_ARGS
        -DBUILD_GTK_TESTS=OFF
        -DBUILD_QT5_TESTS=OFF
        -DBUILD_QT6_TESTS=OFF
        -DBUILD_CPP_TESTS=OFF
        -DENABLE_GLIB=OFF
        -DENABLE_GOBJECT_INTROSPECTION=OFF
        -DENABLE_QT5=OFF
        -DENABLE_QT6=OFF
        -DBUILD_SHARED_LIBS=OFF
    BUILD_BYPRODUCTS ${CMAKE_CURRENT_BINARY_DIR}/poppler-prefix/src/poppler-build/libpoppler.${LIBEXT}
    BUILD_BYPRODUCTS ${CMAKE_CURRENT_BINARY_DIR}/poppler-prefix/src/poppler-build/cpp/libpoppler-cpp.${LIBEXT}
    INSTALL_COMMAND cmake -E echo "Skipping install step."
)

add_library(libpoppler SHARED IMPORTED)
set_target_properties(libpoppler PROPERTIES
    IMPORTED_LOCATION ${CMAKE_CURRENT_BINARY_DIR}/poppler-prefix/src/poppler-build/libpoppler.${LIBEXT})

add_library(libpoppler-cpp SHARED IMPORTED)
set_target_properties(libpoppler-cpp PROPERTIES
    IMPORTED_LOCATION ${CMAKE_CURRENT_BINARY_DIR}/poppler-prefix/src/poppler-build/cpp/libpoppler-cpp.${LIBEXT})

set(PDFS_SOURCES
    src/cmd_page.cc
    src/cmd_preview.cc
    src/cmd_render.cc
    src/cmd_section.cc
    src/cmd_text.cc
    src/document.cc
    src/image_info_dev.cc
    src/main.cc
    src/text_output_dev.cc
)

add_executable(${PROJECT_NAME}
    ${PDFS_SOURCES}
)

target_include_directories(${PROJECT_NAME} PRIVATE
    ${CMAKE_CURRENT_BINARY_DIR}/poppler-prefix/src/poppler/poppler/
    ${CMAKE_CURRENT_BINARY_DIR}/poppler-prefix/src/poppler/
    ${CMAKE_CURRENT_BINARY_DIR}/poppler-prefix/src/poppler-build/poppler/
)

target_link_directories(${PROJECT_NAME} PRIVATE
    /usr/local/lib
)

target_link_libraries(${PROJECT_NAME} PRIVATE
    libpoppler
    libpoppler-cpp
    png
    jpeg
    openjp2
    tiff
    iconv
    lcms2
    nss3
    nssutil3
    smime3
    ssl3
    nspr4
    freetype
    fontconfig
)

add_dependencies(${PROJECT_NAME}
    poppler
)
